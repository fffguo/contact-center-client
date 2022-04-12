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
} from 'app/domain/Bot';
import DraggableDialog, {
  DraggableDialogRef,
} from 'app/components/DraggableDialog/DraggableDialog';
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
import StaffFormContainer from 'app/components/StaffForm/StaffFromContainer';
import Staff from 'app/domain/StaffInfo';
import BotConfigForm from 'app/components/Bot/BotConfigForm';
import TopicAndKnowladgeContainer, {
  TopicOrKnowladgeKey,
  TopicOrKnowladge,
} from 'app/components/Bot/TopicAndKnowladgeContainer';
import unimplemented from 'app/utils/Error';
import { MousePoint, initialMousePoint } from 'app/domain/Client';
import useAlert from 'app/hook/alert/useAlert';
import {
  AllStaffList,
  MUTATION_STAFF,
  QUERY_STAFF,
} from 'app/domain/graphql/Staff';
import TreeToolbar from '../Header/TreeToolbar';
import BotTreeView from './BotTreeView';

type Graphql = AllStaffList;

type TopicOrKnowladgeWithKey = Object.Merge<
  TopicOrKnowladge,
  { topicOrKnowladgeKey: TopicOrKnowladgeKey | undefined }
>;

interface BotProps {
  refetch: (
    variables?: Partial<OperationVariables> | undefined
  ) => Promise<ApolloQueryResult<unknown>>;
  memoData: {
    allKnowledgeBase: KnowledgeBase[];
    botConfigMap: _.Dictionary<BotConfig[]>;
    botConfigList: BotConfig[];
  };
  allTopicCategory: TopicCategory[] | undefined;
  onTopicCategoryClick: (selectTopicCategory?: TopicCategory) => void;
}

const MUTATION_BOT_CONFIG = gql`
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

export default function BotSidecar(props: BotProps) {
  const { memoData, allTopicCategory, refetch, onTopicCategoryClick } = props;
  const [state, setState] = useState<MousePoint>(initialMousePoint);
  const refOfDialog = useRef<DraggableDialogRef>(null);
  const refOfKnowladgeDialog = useRef<DraggableDialogRef>(null);
  const [configStaff, setConfigStaff] = useState<Staff>();
  const [topicOrKnowladge, setTopicOrKnowladge] =
    useState<TopicOrKnowladgeWithKey>({} as TopicOrKnowladgeWithKey);

  const { data, refetch: refetchStaff } = useQuery<Graphql>(QUERY_STAFF);
  const [open, setOpen] = React.useState(false);
  const handleClose = () => {
    setOpen(false);
  };

  const staffMap = useMemo(() => {
    const staffList = [...(data?.allStaff ?? [])].filter(
      (it) => it.staffType === 0
    );
    return _.keyBy(staffList, 'id');
  }, [data?.allStaff]);

  const { onCompleted, onError } = useAlert();
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

  function selectTopic() {
    setState(initialMousePoint);
    onTopicCategoryClick(topicOrKnowladge.Topic);
  }

  function deleteTopicOrKnowladge(topicOrKnowladgeKey: TopicOrKnowladgeKey) {
    setState(initialMousePoint);
    let action: Promise<FetchResult<unknown>> | undefined;
    switch (topicOrKnowladgeKey) {
      case 'Topic': {
        const id = topicOrKnowladge.Topic?.id;
        if (id) action = deleteTopicCategoryById({ variables: { ids: [id] } });

        break;
      }
      case 'Knowladge': {
        setOpen(true);
        break;
      }
      default:
        unimplemented();
    }
    if (action) {
      action.then(refetch).catch((error) => {
        throw error;
      });
    }
  }

  async function handleDialogAgree() {
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
    handleClose();
  }

  /**
   * 关联知识库和机器人
   */
  const interrelateBot = () => {
    setState(initialMousePoint);
    refOfDialog.current?.setOpen(true);
  };

  function mutationCallback(staff: Staff) {
    setConfigStaff(staff);
    refetch();
  }

  const botConfigList =
    memoData.botConfigMap[topicOrKnowladge.Knowladge?.id ?? -1] ?? [];
  const botConfig = botConfigList[0];

  const staffId = botConfig ? botConfig?.botId : undefined;
  const memoStaffAndBotConfig = {
    botConfig,
    staffId,
  };

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
        allKnowledgeBase={memoData.allKnowledgeBase}
        botConfigMap={memoData.botConfigMap}
        staffMap={staffMap}
        setOnContextMenu={handleContextMenuOpen}
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
              关联到客服账号
            </MenuItem>,
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
      <DraggableDialog title="配置机器人账户" ref={refOfDialog}>
        <Typography variant="h5" gutterBottom>
          客服账号配置
        </Typography>
        <StaffFormContainer
          staffId={memoStaffAndBotConfig.staffId}
          mutationCallback={mutationCallback}
        />
        <Divider />
        <Typography variant="h5" gutterBottom>
          机器人配置
        </Typography>
        {(memoStaffAndBotConfig.botConfig && (
          <BotConfigForm
            defaultValues={memoStaffAndBotConfig.botConfig}
            afterMutationCallback={() => {
              refetch();
            }}
          />
        )) ||
          (configStaff && topicOrKnowladge.Knowladge?.id && (
            <BotConfigForm
              defaultValues={{
                botId: configStaff.id,
                knowledgeBaseId: topicOrKnowladge.Knowladge.id,
                noAnswerReply: botConfigNoAnswerReply,
              }}
              afterMutationCallback={() => {
                refetch();
              }}
            />
          ))}
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

      {/* 提醒是否删除知识库 */}
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">确定删除知识库？</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            如果删除知识库，将会删除该知识库下的所有知识分类和知识，并且会删除关联的机器人账号！
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            取消
          </Button>
          <Button onClick={handleDialogAgree} color="secondary" autoFocus>
            确定
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}
