import React, { useRef, useState, useCallback, useMemo } from 'react';

import _ from 'lodash';
import { Object } from 'ts-toolbelt';
import {
  ApolloQueryResult,
  FetchResult,
  gql,
  OperationVariables,
  useMutation,
  useQuery,
} from '@apollo/client';

import Grid from '@material-ui/core/Grid';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';

import {
  BotConfig,
  KnowledgeBase,
  TopicCategory,
  botConfigNoAnswerReply,
  botConfigSimilarQuestionNotice,
} from 'renderer/domain/Bot';
import DraggableDialog, {
  DraggableDialogRef,
} from 'renderer/components/DraggableDialog/DraggableDialog';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Typography,
} from '@material-ui/core';
import StaffFormContainer from 'renderer/components/StaffForm/StaffFromContainer';
import Staff from 'renderer/domain/StaffInfo';
import BotConfigForm, {
  MUTATION_BOT_CONFIG,
} from 'renderer/components/Bot/BotConfigForm';
import TopicAndKnowladgeContainer, {
  TopicOrKnowladgeKey,
  TopicOrKnowladge,
} from 'renderer/components/Bot/TopicAndKnowladgeContainer';
import unimplemented from 'renderer/utils/Error';
import { MousePoint, initialMousePoint } from 'renderer/domain/Client';
import useAlert from 'renderer/hook/alert/useAlert';
import {
  AllStaffList,
  MUTATION_STAFF,
  QUERY_STAFF,
} from 'renderer/domain/graphql/Staff';
import { getDownloadS3ChatFilePath } from 'renderer/config/clientConfig';
import TreeToolbar from '../Header/TreeToolbar';
import BotTreeView from './BotTreeView';
import BotTopicUploadForm from './BotTopicUploadForm';

type Graphql = AllStaffList;

type TopicOrKnowladgeWithKey = Object.Merge<
  TopicOrKnowladge,
  { topicOrKnowladgeKey: TopicOrKnowladgeKey | undefined }
>;

interface BotProps {
  refetch: () => void;
  loading: boolean;
  memoData:
    | {
        allKnowledgeBase: KnowledgeBase[];
        botConfigMap: _.Dictionary<BotConfig[]>;
        botConfigList: BotConfig[];
        memoAllTopic: Topic[];
      }
    | undefined;
  allTopicCategory: TopicCategory[] | undefined;
  onTopicCategoryClick: (selectTopicCategory?: TopicCategory) => void;
  selectTC: TopicCategory | undefined;
}

const MUTATION_DEL_BOT_CONFIG = gql`
  mutation DeleteBotConfig($ids: [Long!]!) {
    deleteBotConfigByIds(ids: $ids)
  }
`;
const MUTATION_KNOWLEDGE_BASE = gql`
  mutation DeleteKnowledgeBase($ids: [Long!]!) {
    deleteKnowledgeBaseByIds(ids: $ids)
  }
`;
const MUTATION_TOPIC_CATEGORY = gql`
  mutation DeleteTopicCategory($ids: [Long!]!) {
    deleteTopicCategoryByIds(ids: $ids)
  }
`;

const MUTATION_TOPIC_EXPORT = gql`
  mutation ExportTopic($knowledgeBaseId: Long!) {
    exportTopic(knowledgeBaseId: $knowledgeBaseId)
  }
`;

export interface MutationExportGraphql {
  exportTopic: string;
}

export default function BotSidecar(props: BotProps) {
  const {
    loading,
    memoData,
    allTopicCategory,
    refetch,
    onTopicCategoryClick,
    selectTC,
  } = props;
  const [state, setState] = useState<MousePoint>(initialMousePoint);
  const refOfDialog = useRef<DraggableDialogRef>(null);
  const refOfBotConfigDialog = useRef<DraggableDialogRef>(null);
  const refOfKnowladgeDialog = useRef<DraggableDialogRef>(null);
  const refOfUploadForm = useRef<DraggableDialogRef>(null);
  const [configStaff, setConfigStaff] = useState<Staff>();
  const [topicOrKnowladge, setTopicOrKnowladge] =
    useState<TopicOrKnowladgeWithKey>({} as TopicOrKnowladgeWithKey);

  const { data, refetch: refetchStaff } = useQuery<Graphql>(QUERY_STAFF);
  const [open, setOpen] = React.useState(false);
  const [tempTopicOrKnowladgeKey, setTempTopicOrKnowladgeKey] =
    useState<TopicOrKnowladgeKey>();
  const handleClose = () => {
    setOpen(false);
  };

  const staffMap = useMemo(() => {
    const staffList = [...(data?.allStaff ?? [])].filter(
      (it) => it.staffType === 0
    );
    return _.keyBy(staffList, 'id');
  }, [data?.allStaff]);

  const { onCompleted, onError, onLoadding, onErrorMsg } = useAlert();

  // 导出知识库
  const [exportTopic, { loading: exporting }] =
    useMutation<MutationExportGraphql>(MUTATION_TOPIC_EXPORT, {
      onCompleted,
      onError,
    });
  if (exporting) {
    onLoadding(loading);
  }

  // 删除 Mutation
  const [deleteKnowledgeBaseById] = useMutation<unknown>(
    MUTATION_KNOWLEDGE_BASE,
    {
      onCompleted,
      onError,
    }
  );
  const [deleteTopicCategoryById] = useMutation<unknown>(
    MUTATION_TOPIC_CATEGORY,
    {
      onCompleted,
      onError,
    }
  );

  const [deleteStaffByIds] = useMutation<unknown>(MUTATION_STAFF, {
    onCompleted,
    onError,
  });

  const [saveBotConfig] = useMutation<Graphql>(MUTATION_BOT_CONFIG);

  const handleContextMenuOpen = useCallback(
    (
      event: React.MouseEvent<HTMLLIElement>,
      topicOrKnowladgeKey: TopicOrKnowladgeKey,
      Knowladge?: KnowledgeBase,
      Topic?: TopicCategory
    ) => {
      event.preventDefault();
      event.stopPropagation();
      setState({
        mouseX: event.clientX - 2,
        mouseY: event.clientY - 4,
      });
      setTopicOrKnowladge({
        Knowladge,
        Topic,
        topicOrKnowladgeKey,
      });
    },
    []
  );

  const handleContextMenuClose = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setState(initialMousePoint);
  };

  function newTopicOrKnowladge(topicOrKnowladgeKey: TopicOrKnowladgeKey) {
    setState(initialMousePoint);
    switch (topicOrKnowladgeKey) {
      case 'Topic': {
        setTopicOrKnowladge({
          topicOrKnowladgeKey,
          // 表单 default value
          Topic: { knowledgeBaseId: topicOrKnowladge.Knowladge?.id },
        });
        break;
      }
      default: {
        setTopicOrKnowladge({ topicOrKnowladgeKey });
        break;
      }
    }
    refOfKnowladgeDialog.current?.setOpen(true);
  }

  function editTopicOrKnowladge(topicOrKnowladgeKey: TopicOrKnowladgeKey) {
    setState(initialMousePoint);
    setTopicOrKnowladge(_.assignIn({ topicOrKnowladgeKey }, topicOrKnowladge));
    refOfKnowladgeDialog.current?.setOpen(true);
  }

  function addTopicChild(topicOrKnowladgeKey: TopicOrKnowladgeKey) {
    setState(initialMousePoint);
    if (topicOrKnowladge.Topic?.id) {
      setTopicOrKnowladge({
        topicOrKnowladgeKey,
        // 表单 default value
        Topic: {
          knowledgeBaseId: topicOrKnowladge.Topic?.knowledgeBaseId,
          pid: topicOrKnowladge.Topic.id,
        },
      });
      refOfKnowladgeDialog.current?.setOpen(true);
    }
  }

  function selectTopic() {
    setState(initialMousePoint);
    onTopicCategoryClick(topicOrKnowladge.Topic);
  }

  function deleteTopicOrKnowladge(topicOrKnowladgeKey: TopicOrKnowladgeKey) {
    setState(initialMousePoint);
    setTempTopicOrKnowladgeKey(topicOrKnowladgeKey);
    setOpen(true);
  }

  async function handleDialogAgree() {
    let action: Promise<FetchResult<unknown>> | undefined;
    switch (tempTopicOrKnowladgeKey) {
      case 'Topic': {
        if (
          topicOrKnowladge?.Topic?.children &&
          topicOrKnowladge?.Topic?.children.length > 0
        ) {
          onErrorMsg('当前分类不为空，请先删除子分类');
        } else if (
          topicOrKnowladge.Topic?.topicList &&
          topicOrKnowladge.Topic?.topicList?.length > 0
        ) {
          onErrorMsg('当前分类下存在问题条目，请先删除问题条目');
        } else {
          const id = topicOrKnowladge.Topic?.id;
          if (id)
            action = deleteTopicCategoryById({ variables: { ids: [id] } });
        }
        break;
      }
      case 'Knowladge': {
        const id = topicOrKnowladge.Knowladge?.id;
        const botConfig = topicOrKnowladge.Knowladge?.botConfig;
        if (id) {
          await deleteKnowledgeBaseById({ variables: { ids: [id] } });
        }
        if (botConfig) {
          await deleteStaffByIds({
            variables: { ids: [botConfig.botId] },
          });
        }
        await refetch();
        break;
      }
      default:
        unimplemented();
    }
    handleClose();
    if (action) {
      action.then(refetch).catch((error) => {
        throw error;
      });
    }
  }

  /**
   * 关联机器人账号
   */
  const interrelateBot = () => {
    setState(initialMousePoint);
    refOfDialog.current?.setOpen(true);
  };

  /**
   * 修改机器人配置
   */
  const openBotConfig = () => {
    setState(initialMousePoint);
    refOfBotConfigDialog.current?.setOpen(true);
  };

  const botConfigList =
    memoData?.botConfigMap[topicOrKnowladge.Knowladge?.id ?? -1] ?? [];
  const botConfig = botConfigList[0];

  const staffId = botConfig ? botConfig?.botId : undefined;
  const memoStaffAndBotConfig = {
    botConfig,
    staffId,
  };

  async function mutationCallback(staff: Staff) {
    setConfigStaff(staff);
    if (memoStaffAndBotConfig.botConfig) {
      refetch();
    } else {
      if (topicOrKnowladge?.Knowladge?.id) {
        // 是新账号，就新建一个机器人配置
        // 防止用户不点击机器人配置按钮，导致没有机器人配置
        await saveBotConfig({
          variables: {
            botConfigInput: {
              botId: staff.id,
              knowledgeBaseId: topicOrKnowladge?.Knowladge?.id,
              noAnswerReply: botConfigNoAnswerReply,
              questionPrecision: 0.9,
              similarQuestionEnable: true,
              similarQuestionNotice: botConfigSimilarQuestionNotice,
              similarQuestionCount: 5,
            },
          },
        });
      }
      refetch();
    }
  }

  return (
    <Grid item xs={12} sm={2}>
      {/* 功能菜单 */}
      <TreeToolbar
        title="知识库"
        refetch={() => {
          refetch();
          refetchStaff();
        }}
        adderName="添加知识库"
        add={() => newTopicOrKnowladge('Knowladge')}
        clearTopicCategorySelect={() => {
          onTopicCategoryClick(undefined);
        }}
      />
      {/* 知识库，分类 树状列表 */}
      <BotTreeView
        loading={loading}
        allKnowledgeBase={memoData?.allKnowledgeBase}
        botConfigMap={memoData?.botConfigMap}
        staffMap={staffMap}
        setOnContextMenu={handleContextMenuOpen}
        selectTC={selectTC}
      />
      {/* 右键菜单 */}
      <div
        onContextMenu={handleContextMenuClose}
        style={{ cursor: 'context-menu' }}
      >
        <Menu
          keepMounted
          open={state.mouseY !== undefined}
          onClose={handleContextMenuClose}
          anchorReference="anchorPosition"
          anchorPosition={
            state.mouseY !== undefined && state.mouseX !== undefined
              ? { top: state.mouseY, left: state.mouseX }
              : undefined
          }
        >
          {topicOrKnowladge.topicOrKnowladgeKey === 'Knowladge' && [
            <MenuItem key="interrelateBot" onClick={interrelateBot}>
              关联机器人账号
            </MenuItem>,
            <MenuItem key="openBotConfig" onClick={openBotConfig}>
              机器人配置
            </MenuItem>,
            <Divider />,
            <MenuItem
              key="editTopicOrKnowladge"
              onClick={() => {
                editTopicOrKnowladge('Knowladge');
              }}
            >
              修改知识库
            </MenuItem>,
            <MenuItem
              key="addTopicCategory"
              onClick={() => {
                setState(initialMousePoint);
                newTopicOrKnowladge('Topic');
              }}
            >
              添加知识库分类
            </MenuItem>,
            <MenuItem
              key="deleteTopicOrKnowladge"
              onClick={() => {
                deleteTopicOrKnowladge('Knowladge');
              }}
            >
              删除知识库
            </MenuItem>,
            <Divider />,
            <MenuItem
              key="exportTopic"
              onClick={async () => {
                setState(initialMousePoint);
                if (topicOrKnowladge?.Knowladge?.id) {
                  const exportResult = await exportTopic({
                    variables: {
                      knowledgeBaseId: topicOrKnowladge.Knowladge.id,
                    },
                  });
                  const filekey = exportResult.data?.exportTopic;
                  if (filekey) {
                    const url = `${getDownloadS3ChatFilePath()}${filekey}`;
                    window.open(url, '_blank');
                  } else {
                    onErrorMsg('导出失败');
                  }
                }
              }}
            >
              导出知识库
            </MenuItem>,
            <MenuItem
              key="importTopic"
              onClick={() => {
                setState(initialMousePoint);
                refOfUploadForm.current?.setOpen(true);
              }}
            >
              导入知识库
            </MenuItem>,
          ]}
          {topicOrKnowladge.topicOrKnowladgeKey === 'Topic' && [
            <MenuItem
              key="selectTopic"
              onClick={() => {
                selectTopic();
              }}
            >
              筛选知识库分类
            </MenuItem>,
            <MenuItem
              key="addTopicCategory"
              onClick={() => {
                setState(initialMousePoint);
                addTopicChild('Topic');
              }}
            >
              添加子分类
            </MenuItem>,
            <MenuItem
              key="editTopicOrKnowladge"
              onClick={() => {
                editTopicOrKnowladge('Topic');
              }}
            >
              修改知识分类
            </MenuItem>,
            <MenuItem
              key="deleteTopicOrKnowladge"
              onClick={() => {
                deleteTopicOrKnowladge('Topic');
              }}
            >
              删除知识分类
            </MenuItem>,
          ]}
        </Menu>
      </div>
      {/* 显示 弹窗配置知识库对应的机器人 */}
      <DraggableDialog title="关联机器人账号" ref={refOfDialog}>
        <StaffFormContainer
          staffId={memoStaffAndBotConfig.staffId}
          mutationCallback={(staff) => {
            mutationCallback(staff);
          }}
        />
      </DraggableDialog>
      <DraggableDialog title="机器人配置" ref={refOfBotConfigDialog}>
        {(memoStaffAndBotConfig.botConfig && (
          <BotConfigForm
            defaultValues={memoStaffAndBotConfig.botConfig}
            afterMutationCallback={() => {
              refetch();
            }}
            allTopic={memoData?.memoAllTopic}
          />
        )) ||
          (configStaff && topicOrKnowladge.Knowladge?.id && (
            <BotConfigForm
              defaultValues={{
                botId: configStaff.id,
                knowledgeBaseId: topicOrKnowladge.Knowladge.id,
                noAnswerReply: botConfigNoAnswerReply,
                questionPrecision: 0.9,
                similarQuestionEnable: true,
                similarQuestionNotice: botConfigSimilarQuestionNotice,
                similarQuestionCount: 5,
              }}
              afterMutationCallback={() => {
                refetch();
              }}
              allTopic={memoData?.memoAllTopic}
            />
          )) || <Typography>请先关联一个机器人账号</Typography>}
      </DraggableDialog>
      <DraggableDialog
        title={
          (topicOrKnowladge.topicOrKnowladgeKey === 'Knowladge' &&
            '配置知识库') ||
          '配置知识库分类'
        }
        ref={refOfKnowladgeDialog}
      >
        {topicOrKnowladge.topicOrKnowladgeKey === 'Topic' && (
          <TopicAndKnowladgeContainer
            showWhat="Topic"
            defaultValue={topicOrKnowladge.Topic}
            allTopicCategoryList={allTopicCategory ?? []}
          />
        )}
        {topicOrKnowladge.topicOrKnowladgeKey === 'Knowladge' && (
          <TopicAndKnowladgeContainer
            showWhat="Knowladge"
            defaultValue={topicOrKnowladge.Knowladge}
            allTopicCategoryList={allTopicCategory ?? []}
          />
        )}
      </DraggableDialog>
      <DraggableDialog title="导入知识库" ref={refOfUploadForm}>
        {topicOrKnowladge.Knowladge && topicOrKnowladge.Knowladge.id && (
          <BotTopicUploadForm
            knowledgeBaseId={topicOrKnowladge.Knowladge.id}
            onSuccess={() => {
              refetch();
            }}
          />
        )}
      </DraggableDialog>
      {/* 提醒是否删除知识库 */}
      <Dialog
        open={open && Boolean(tempTopicOrKnowladgeKey)}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {tempTopicOrKnowladgeKey === 'Topic'
            ? '确定删除知识库分类？'
            : '确定删除知识库？'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {tempTopicOrKnowladgeKey === 'Topic'
              ? ''
              : '如果删除知识库，将会删除该知识库下的所有知识分类和知识，并且会删除关联的机器人账号！'}
            此操作不可逆，请谨慎操作！
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            取消
          </Button>
          <Button
            onClick={() => {
              handleDialogAgree();
            }}
            color="secondary"
            autoFocus
          >
            确定
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}
