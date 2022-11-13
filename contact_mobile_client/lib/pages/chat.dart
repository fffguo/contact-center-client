import 'dart:convert';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:contact_mobile_client/common/config.dart';
import 'package:contact_mobile_client/common/globals.dart';
import 'package:contact_mobile_client/model/conversation.dart';
import 'package:contact_mobile_client/model/customer.dart';
import 'package:contact_mobile_client/model/message.dart';
import 'package:contact_mobile_client/model/staff.dart';
import 'package:contact_mobile_client/model/constants.dart';
import 'package:contact_mobile_client/model/web_socket_request.dart';
import 'package:contact_mobile_client/states/state.dart';
import 'package:easy_image_viewer/easy_image_viewer.dart';
import 'package:edge_alerts/edge_alerts.dart';
import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:flutter_html/flutter_html.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:url_launcher/url_launcher.dart';

import 'package:http/http.dart' as http;
import 'customer_info.dart';

class ChatterScreen extends StatefulHookConsumerWidget {
  const ChatterScreen({super.key});

  @override
  ChatterScreenState createState() => ChatterScreenState();
}

class ChatterScreenState extends ConsumerState<ChatterScreen> {
  final chatMsgTextController = TextEditingController();
  Staff? _currentStaff;
  late Session _currentSession;
  late Customer _customer;
  String? messageText;

  // void getMessages() async {
  //   final messages=await _firestore.collection('messages').getDocuments();
  //   for(var message in messages.documents){
  //     print(message.data);
  //   }
  // }

  // void messageStream() async {
  //   await for (var snapshot in _firestore.collection('messages').snapshots()) {
  //     snapshot.documents;
  //   }
  // }

  sendTextMessage() {
    if (messageText != null && messageText!.isNotEmpty) {
      final content = Content(
          contentType: "TEXT", textContent: TextContent(text: messageText!));
      sendMessage(content);
    }
  }

  sendImageMessage(String imageUrl, XFile file) async {
    final content = Content(
        contentType: "IMAGE",
        photoContent: PhotoContent(
            mediaId: imageUrl,
            filename: file.name,
            picSize: await file.length(),
            type: 'auto'));
    sendMessage(content);
  }

  sendMessage(Content content) {
    final message = Message(
        uuid: uuid.v4(),
        to: _customer.id,
        type: CreatorType.customer,
        creatorType: CreatorType.staff,
        content: content);
    // 使用 websocket 发送消息
    final messageMap = message.toJson();
    messageMap.removeWhere((key, value) => value == null);

    final request = WebSocketRequest.generateRequest(messageMap);
    ref.read(chatStateProvider.notifier).newMessage({_customer.id: message});
    Globals.socket?.emitWithAck('msg/send', request, ack: (data) {
      final response = WebSocketResponse.fromJson(data);
      final body = response.body as Map<String, dynamic>;
      ref.read(chatStateProvider.notifier).updateMessageSeqId(
          _customer.id, message.uuid, body['seqId'], body['createdAt']);
    });
  }

  @override
  Widget build(BuildContext context) {
    _currentStaff = ref.watch(staffProvider);
    // final args =
    //     ModalRoute.of(context)!.settings.arguments as Map<String, dynamic>;
    // final selectUserId = args['selectUserId'] as int;
    final selectUserId =
        ref.watch(chatStateProvider.select((value) => value.chattingUserId));
    final selectSession = ref.watch(chatStateProvider
        .select((value) => value.sessionMap[value.chattingUserId]));

    final sessionMsgList = selectSession?.messageList;
    final topMsgId =
        sessionMsgList?.isNotEmpty ?? false ? sessionMsgList?.last.seqId : null;

    final historyMessageResult = useQuery(QueryOptions(
      document: gql(Message.loadHistoryMsg),
      variables: {'userId': selectUserId, 'cursor': topMsgId, 'limit': 20},
    ));

    List<Message> messageList = [];

    if (selectUserId != null && selectSession != null) {
      _currentSession = selectSession;
      _customer = selectSession.customer;

      final staffDraft = selectSession.staffDraft;
      if (staffDraft != null) {
        // 设置草稿到输入框
        chatMsgTextController.text = staffDraft;
      }

      if (_currentSession.shouldSync) {
        Future.delayed(const Duration(seconds: 1), () {
          historyMessageResult.refetch();
          ref
              .read(chatStateProvider.notifier)
              .setShouldSync(userId: _currentSession.conversation.userId);
        });
      }

      final messageListMap =
          historyMessageResult.result.data?['loadHistoryMessage'];
      if (messageListMap != null) {
        final messagePage = PageResult.fromJson(messageListMap);
        final historyMsgList =
            messagePage.content.map((e) => Message.fromJson(e)).toList();
        messageList.addAll(historyMsgList);
      }
      messageList.addAll(_currentSession.messageList ?? []);
    } else {
      Future.delayed(const Duration(seconds: 1), () {
        if (!mounted) return;
        Navigator.of(context).pushNamed('/home');
      });
    }

    int? fetchMoreCursor;

    if (messageList.isNotEmpty) {
      // 去重
      messageList = messageList
          .map((e) => {e.uuid: e})
          .reduce((value, element) {
            value.addAll(element);
            return value;
          })
          .values
          .toList();

      messageList.sort((a, b) =>
          (b.seqId ?? 0x7fffffffffffffff) - (a.seqId ?? 0x7fffffffffffffff));
      fetchMoreCursor = messageList.last.seqId;
    }

    FetchMoreOptions opts = FetchMoreOptions(
      variables: {
        'userId': selectUserId,
        'cursor': fetchMoreCursor,
        'limit': 20
      },
      updateQuery: (previousResultData, fetchMoreResultData) {
        // this function will be called so as to combine both the original and fetchMore results
        // it allows you to combine them as you would like
        final List<dynamic> repos = [
          ...previousResultData?['loadHistoryMessage']['content']
              as List<dynamic>,
          ...?fetchMoreResultData?['loadHistoryMessage']['content']
              as List<dynamic>?,
        ];

        // to avoid a lot of work, lets just update the list of repos in returned
        // data with new data, this also ensures we have the endCursor already set
        // correctly
        fetchMoreResultData?['loadHistoryMessage']['content'] = repos;

        return fetchMoreResultData;
      },
    );

    return WillPopScope(
      onWillPop: () => Future.sync(() {
        final chatStatePN = ref.read(chatStateProvider.notifier);
        if (!mounted) return false;
        if (messageText != null &&
            messageText!.isNotEmpty &&
            selectUserId != null) {
          chatStatePN.setStaffDraft(selectUserId, messageText!);
        }
        chatStatePN.clearChattingUser();
        return true;
      }),
      child: Scaffold(
        // AppBar 会自动提供回退按钮 可通过 automaticallyImplyLeading 修改
        appBar: AppBar(
          iconTheme: const IconThemeData(color: Colors.deepPurple),
          elevation: 0,
          bottom: PreferredSize(
            preferredSize: const Size(25, 10),
            child: Container(
              decoration: const BoxDecoration(
                  // color: Colors.blue,
                  // borderRadius: BorderRadius.circular(20)
                  ),
              constraints: const BoxConstraints.expand(height: 1),
              child: LinearProgressIndicator(
                valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
                backgroundColor: Colors.blue[100],
              ),
            ),
          ),
          backgroundColor: Colors.white10,
          // leading: Padding(
          //   padding: const EdgeInsets.all(12.0),
          //   child: CircleAvatar(backgroundImage: NetworkImage('https://cdn.clipart.email/93ce84c4f719bd9a234fb92ab331bec4_frisco-specialty-clinic-vail-health_480-480.png'),),
          // ),
          title: Row(
            children: <Widget>[
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Text(
                    _currentSession.customer.name,
                    style: const TextStyle(
                        fontFamily: 'Poppins',
                        fontSize: 16,
                        color: Colors.deepPurple),
                  ),
                  Text(_currentSession.customer.uid,
                      style: const TextStyle(
                          fontFamily: 'Poppins',
                          fontSize: 8,
                          color: Colors.deepPurple))
                ],
              ),
            ],
          ),
          actions: <Widget>[
            GestureDetector(
              child: PopupMenuButton<String>(
                onSelected: (select) {
                  if (select == 'user') {
                    // Navigator.pop(context);
                    Navigator.of(context).push(MaterialPageRoute(
                      builder: (context) => CustomerInfo(selectUserId!),
                      // builder: (context) => XBCSLogin(),
                    ));
                  }
                },
                itemBuilder: (context) {
                  return [
                    // PopupMenuItem(
                    //   onTap: () {},
                    //   child: const Text(
                    //     '历史会话',
                    //   ),
                    // ),
                    PopupMenuItem(
                      // 无法使用 onTap 进行 Navigator 跳转
                      // 因为 PopupMenuButton 的 showMenu 使用 navigator.of
                      value: 'user',
                      child: Text(
                        AppLocalizations.of(context)!.userInformation,
                      ),
                    ),
                    PopupMenuItem(
                      onTap: () {
                        ref
                            .read(chatStateProvider.notifier)
                            .hideConv(_customer.id);
                        Navigator.pop(context);
                      },
                      child: Text(
                        AppLocalizations.of(context)!.closeTheSession,
                      ),
                    ),
                  ];
                },
              ),
            )
          ],
        ),
        body: Column(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            ChatStream(
              messageList: messageList,
              staff: _currentStaff!,
              customer: _currentSession.customer,
              onRefresh: () {
                return historyMessageResult.fetchMore(opts);
              },
            ),
            Container(
              padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 10),
              decoration: kMessageContainerDecoration,
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: <Widget>[
                  Expanded(
                    child: Material(
                      borderRadius: BorderRadius.circular(50),
                      color: Colors.white,
                      elevation: 5,
                      child: Padding(
                        padding:
                            const EdgeInsets.only(left: 8.0, top: 2, bottom: 2),
                        child: TextField(
                          onChanged: (value) {
                            setState(() {
                              messageText = value;
                            });
                          },
                          controller: chatMsgTextController,
                          decoration: kMessageTextFieldDecoration,
                        ),
                      ),
                    ),
                  ),
                  (messageText != null && messageText!.isNotEmpty)
                      ? MaterialButton(
                          shape: const CircleBorder(),
                          color: Colors.blue,
                          onPressed: () {
                            chatMsgTextController.clear();
                            sendTextMessage();
                            setState(() {
                              messageText = null;
                            });
                          },
                          child: const Padding(
                            padding: EdgeInsets.all(10.0),
                            child: Icon(
                              Icons.send,
                              color: Colors.white,
                            ),
                          )
                          // Text(
                          //   'Send',
                          //   style: kSendButtonTextStyle,
                          // ),
                          )
                      : MaterialButton(
                          shape: const CircleBorder(),
                          color: Colors.grey,
                          onPressed: () async {
                            final ImagePicker picker = ImagePicker();
                            final XFile? image = await picker.pickImage(
                                source: ImageSource.gallery);
                            if (image != null) {
                              String url = "$serverIp/s3/chat/${Globals.orgId}";
                              final request =
                                  http.MultipartRequest('POST', Uri.parse(url));
                              final filePart =
                                  await http.MultipartFile.fromPath(
                                      'file', image.path);
                              request.files.add(filePart);
                              http.Response response =
                                  await http.Response.fromStream(
                                      await request.send());
                              if (response.statusCode == 200) {
                                final imageUrl =
                                    jsonDecode(response.body) as List<dynamic>;
                                sendImageMessage(imageUrl[0], image);
                              } else {
                                if (!mounted) return;
                                edgeAlert(context,
                                    title: AppLocalizations.of(context)!
                                        .failedToUploadImage,
                                    description: AppLocalizations.of(context)!
                                        .thereIsAProblemWithTheRemoteServerPleaseTryAgainLater,
                                    gravity: Gravity.bottom,
                                    icon: Icons.error,
                                    duration: 5,
                                    backgroundColor: Colors.redAccent);
                              }
                            }
                          },
                          child: const Padding(
                            padding: EdgeInsets.all(10.0),
                            child: Icon(
                              Icons.image,
                              color: Colors.white,
                            ),
                          )
                          // Text(
                          //   'Send',
                          //   style: kSendButtonTextStyle,
                          // ),
                          ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class ChatStream extends StatelessWidget {
  final List<Message> messageList;
  final Staff staff;
  final Customer customer;
  final Future<void> Function() onRefresh;

  const ChatStream(
      {super.key,
      required this.messageList,
      required this.staff,
      required this.customer,
      required this.onRefresh});

  @override
  Widget build(BuildContext context) {
    List<MessageBubble> messageWidgets = [];

    final messageList = this.messageList;

    if (messageList.isNotEmpty) {
      for (var message in messageList) {
        final isStaff = message.creatorType == CreatorType.staff;
        final msgBubble = MessageBubble(
          msgSender: isStaff ? staff.nickName : customer.name,
          staff: isStaff,
          message: message,
        );
        messageWidgets.add(msgBubble);
      }

      return Expanded(
        child: RefreshIndicator(
          onRefresh: onRefresh,
          child: ListView(
            reverse: true,
            padding: const EdgeInsets.symmetric(vertical: 15, horizontal: 10),
            children: messageWidgets,
          ),
        ),
      );
    } else {
      return const Center(
        child: CircularProgressIndicator(backgroundColor: Colors.deepPurple),
      );
    }
  }
}

class MessageBubble extends StatefulHookConsumerWidget {
  final String msgSender;
  final bool staff;
  final Message message;

  const MessageBubble(
      {super.key,
      required this.msgSender,
      required this.staff,
      required this.message});

  @override
  MessageBubbleState createState() => MessageBubbleState();
}

class MessageBubbleState extends ConsumerState<MessageBubble> {
  Offset? _tapPosition;

  void _storePosition(TapDownDetails details) {
    _tapPosition = details.globalPosition;
  }

  void _showCustomMenu() async {
    final RenderBox overlay =
        Overlay.of(context)?.context.findRenderObject() as RenderBox;
    String? select = await showMenu(
        context: context,
        items: <PopupMenuEntry<String>>[const MessageOptionEntry()],
        position: RelativeRect.fromRect(
            _tapPosition! & const Size(40, 40), // smaller rect, the touch area
            Offset.zero & overlay.size // Bigger rect, the entire screen
            ));
    if (select != null) {
      switch (select) {
        case 'withdrawMsg':
          // 撤回消息
          final content = Content(
              contentType: 'SYS',
              sysCode: 'WITHDRAW',
              serviceContent: const JsonEncoder().convert({
                'uuid': widget.message.uuid,
                'seqId': widget.message.seqId,
              }));
          final message = Message(
            uuid: uuid.v4(),
            to: widget.message.to,
            type: CreatorType.customer,
            creatorType: CreatorType.sys,
            content: content,
          );
          final messageMap = message.toJson();
          messageMap.removeWhere((key, value) => value == null);
          final request = WebSocketRequest.generateRequest(messageMap);
          Globals.socket?.emitWithAck('msg/send', request, ack: (data) {
            ref
                .read(chatStateProvider.notifier)
                .deleteMessage(widget.message.to!, message.uuid);
          });
          break;
        default:
          break;
      }
    }
  }

  Widget createBubble(BuildContext context, Message message) {
    Widget result = Text(
      AppLocalizations.of(context)!.unsupportedMessageType,
      style: TextStyle(
        color: widget.staff ? Colors.white : Colors.blue,
        fontFamily: 'Poppins',
        fontSize: 15,
      ),
    );
    final content = message.content;
    switch (message.content.contentType) {
      case 'TEXT':
        result = Text(
          content.textContent?.text ?? '',
          style: TextStyle(
            color: widget.staff ? Colors.white : Colors.blue,
            fontFamily: 'Poppins',
            fontSize: 15,
          ),
        );
        break;
      case 'IMAGE':
        final imageUrl = "$serverIp${content.photoContent?.mediaId}";
        result = CachedNetworkImage(
          imageUrl: imageUrl,
          progressIndicatorBuilder: (context, url, progress) {
            return Container(
              decoration: const BoxDecoration(
                color: Color(0xffE8E8E8),
                borderRadius: BorderRadius.all(
                  Radius.circular(8),
                ),
              ),
              width: 200,
              height: 200,
              child: Center(
                child: CircularProgressIndicator(
                  color: const Color(0xfff5a623),
                  value: progress.progress,
                ),
              ),
            );
          },
          imageBuilder: (context, imageProvider) {
            return InkWell(
                onTap: () {
                  showImageViewer(context, imageProvider);
                },
                child: Image(image: imageProvider));
          },
          errorWidget: (context, object, stackTrace) {
            return Material(
              borderRadius: const BorderRadius.all(
                Radius.circular(8),
              ),
              clipBehavior: Clip.hardEdge,
              child: Image.asset(
                'images/img_not_available.jpeg',
                width: 200,
                height: 200,
                fit: BoxFit.cover,
              ),
            );
          },
          width: 200,
          height: 200,
          fit: BoxFit.cover,
        );
        break;
      case 'RICH_TEXT':
        final htmlText = content.textContent?.text;
        if (htmlText != null) {
          result = Html(
            data: htmlText,
            onLinkTap: (String? url, RenderContext context,
                Map<String, String> attributes, dynamic element) async {
              if (url != null && await canLaunchUrl(Uri.parse(url))) {
                await launchUrl(Uri.parse(url));
              } else {
                throw 'Could not launch $url';
              }
            },
          );
        }
        break;
      default:
        break;
    }
    return result;
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(12.0),
      child: Column(
        crossAxisAlignment:
            widget.staff ? CrossAxisAlignment.end : CrossAxisAlignment.start,
        children: <Widget>[
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10),
            child: Text(
              widget.msgSender,
              style: const TextStyle(
                  fontSize: 13, fontFamily: 'Poppins', color: Colors.black87),
            ),
          ),
          Material(
            borderRadius: BorderRadius.only(
              bottomLeft: const Radius.circular(50),
              topLeft: widget.staff
                  ? const Radius.circular(50)
                  : const Radius.circular(0),
              bottomRight: const Radius.circular(50),
              topRight: widget.staff
                  ? const Radius.circular(0)
                  : const Radius.circular(50),
            ),
            color: widget.staff ? Colors.green : Colors.white,
            elevation: 5,
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 20),
              child: GestureDetector(
                onTapDown: _storePosition,
                onLongPress: widget.staff &&
                        DateTime.now().microsecondsSinceEpoch -
                                (widget.message.createdAt ?? 0) * 1000 <=
                            2 * 60 * 1000
                    ? _showCustomMenu
                    : null,
                child: createBubble(context, widget.message),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class MessageOptionEntry extends PopupMenuEntry<String> {
  @override
  final double height = 100;

  const MessageOptionEntry({super.key});

  // height doesn't matter, as long as we are not giving
  // initialValue to showMenu().

  @override
  bool represents(String? value) => value == 'withdrawMsg';

  @override
  MessageOptionEntryState createState() => MessageOptionEntryState();
}

class MessageOptionEntryState extends State<MessageOptionEntry> {
  void withdrawMsg() {
    // This is how you close the popup menu and return user selection.
    Navigator.pop<String>(context, 'withdrawMsg');
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      children: <Widget>[
        Expanded(
            child: TextButton(onPressed: withdrawMsg, child: const Text('撤回'))),
      ],
    );
  }
}
