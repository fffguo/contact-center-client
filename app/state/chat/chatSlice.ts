import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import Fuse from 'fuse.js';
import _ from 'lodash';

import Chat, {
  QuickReply,
  QuickReplyAllDto,
  UserMessages,
} from 'app/domain/Chat';
import { noGroupOptions } from 'app/utils/fuseUtils';
import { MessagesMap } from 'app/domain/Message';

const initChat = {} as Chat;

let noGroupFuse: Fuse<QuickReply>;
let noGroupIndex: Fuse.FuseIndex<QuickReply>;

function setNoGroupIndex(datas: QuickReply[]) {
  noGroupIndex = Fuse.createIndex(noGroupOptions.keys, datas);
}

const chatSlice = createSlice({
  name: 'chat',
  initialState: initChat,
  reducers: {
    setSelectedSession: (chat, action: PayloadAction<number>) => {
      chat.selectedSession = action.payload;
    },
    setQuickReplySearchText: (chat, action: PayloadAction<string>) => {
      chat.quickReplySearchText = action.payload;
      const result: QuickReply[] = [];
      if (chat.quickReplySearchText && chat.quickReplySearchText !== '') {
        const noGroupResult = noGroupFuse.search(action.payload);
        noGroupResult.forEach((r) => result.push(r.item));
      }
      chat.searchQuickReply = result;
    },
    setQuickReply: (chat, action: PayloadAction<QuickReplyAllDto>) => {
      chat.quickReply = action.payload;

      const result: QuickReply[] = [];
      action.payload.org.withGroup?.forEach((g) =>
        g.quickReply?.forEach((q) => {
          result.push(q);
        })
      );
      action.payload.personal.withGroup?.forEach((g) =>
        g.quickReply?.forEach((q) => {
          result.push(q);
        })
      );
      if (chat.quickReply.personal.noGroup) {
        result.push(...chat.quickReply.personal.noGroup);
      }
      if (chat.quickReply.org.noGroup) {
        result.push(...chat.quickReply.org.noGroup);
      }

      chat.filterQuickReply = result;

      setNoGroupIndex(result);
      noGroupFuse = new Fuse(
        chat.filterQuickReply,
        noGroupOptions,
        noGroupIndex
      );
    },
    setMonitoredMessage: (chat, action: PayloadAction<UserMessages>) => {
      const { userId } = chat.monitoredUser;
      const messageMap = action.payload[userId].map((m) => {
        return { [m.uuid]: m } as MessagesMap;
      });
      chat.monitoredMessageList[userId] = _.defaults(
        chat.monitoredMessageList[userId],
        messageMap
      );
    },
  },
});

export default chatSlice;

export const { reducer } = chatSlice;
