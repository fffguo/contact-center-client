import React from 'react';

import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import TreeView from '@material-ui/lab/TreeView';
import LibraryBooksIcon from '@material-ui/icons/LibraryBooks';
import FilterListIcon from '@material-ui/icons/FilterList';
import Skeleton from '@material-ui/lab/Skeleton';

import { BotConfig, KnowledgeBase, TopicCategory } from 'renderer/domain/Bot';
import StyledTreeItem, {
  CloseSquare,
  MinusSquare,
  PlusSquare,
} from 'renderer/components/TreeView/StyledTreeItem';
import { TopicOrKnowladgeKey } from 'renderer/components/Bot/TopicAndKnowladgeContainer';
import {
  Box,
  Divider,
  Grid,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@material-ui/core';
import Staff from 'renderer/domain/StaffInfo';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    list: {
      width: '100%',
      height: '80vh',
      backgroundColor: theme.palette.background.paper,
    },
    media: {
      marginTop: 10,
    },
  })
);

interface BotTreeViewProps {
  loading: boolean;
  allKnowledgeBase: KnowledgeBase[] | undefined;
  botConfigMap: _.Dictionary<BotConfig[]> | undefined;
  staffMap: _.Dictionary<Staff> | undefined;
  setOnContextMenu: (
    event: React.MouseEvent<HTMLLIElement>,
    topicOrKnowladgeKey: TopicOrKnowladgeKey,
    knowledgeBase?: KnowledgeBase,
    topicCategory?: TopicCategory
  ) => void;
  selectTC: TopicCategory | undefined;
}

function buildTopicCategory(
  topicCategoryList: TopicCategory[],
  onContextMenu: (
    event: React.MouseEvent<HTMLLIElement>,
    type: TopicOrKnowladgeKey,
    knowledgeBase?: KnowledgeBase | undefined,
    topicCategory?: TopicCategory | undefined
  ) => void,
  selectTC: TopicCategory | undefined
) {
  return topicCategoryList.map((cl) => (
    <StyledTreeItem
      key={cl.id?.toString()}
      nodeId={`topicCategory-${cl.id}`}
      label={
        <>
          <ListItem component="ul">
            {cl.name}
            {selectTC && selectTC.id === cl.id && (
              <FilterListIcon fontSize="small" />
            )}
          </ListItem>
        </>
      }
      onContextMenu={(event) => {
        if (onContextMenu) {
          onContextMenu(event, 'Topic', undefined, cl);
        }
      }}
    >
      {cl.children && buildTopicCategory(cl.children, onContextMenu, selectTC)}
    </StyledTreeItem>
  ));
}

export default React.memo(function BotTreeView(props: BotTreeViewProps) {
  const {
    loading,
    allKnowledgeBase,
    botConfigMap,
    staffMap,
    setOnContextMenu,
    selectTC,
  } = props;
  const classes = useStyles();

  const handleContextMenuOpen = (
    event: React.MouseEvent<HTMLLIElement>,
    topicOrKnowladgeKey: TopicOrKnowladgeKey,
    Knowladge?: KnowledgeBase,
    Topic?: TopicCategory
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setOnContextMenu(event, topicOrKnowladgeKey, Knowladge, Topic);
  };
  return (
    <>
      <TreeView
        className={classes.list}
        defaultCollapseIcon={<MinusSquare />}
        defaultExpandIcon={<PlusSquare />}
        defaultEndIcon={<CloseSquare />}
      >
        {(loading || !allKnowledgeBase) && (
          <div className={classes.media}>
            <Box display="flex" alignItems="center">
              <Box margin={1}>
                <Skeleton variant="circle" width={40} height={40} />
              </Box>
              <Box width="100%">
                <Skeleton
                  animation="wave"
                  height={10}
                  style={{ marginBottom: 6 }}
                />
                <Skeleton animation="wave" height={10} width="80%" />
              </Box>
            </Box>
          </div>
        )}
        {!loading &&
          allKnowledgeBase &&
          allKnowledgeBase.map((base: KnowledgeBase) => (
            <StyledTreeItem
              key={base.id?.toString()}
              nodeId={`knowledgeBase-${base.id}`}
              label={
                <ListItem component="ul">
                  <ListItemIcon>
                    <LibraryBooksIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={(
                      <Typography variant="body1" display="inline">
                        {base.name}
                      </Typography>
                    )}
                    disableTypography
                    secondary={(
                      <Grid container alignItems="center">
                        <Typography
                          variant="body2"
                          color="primary"
                          display="inline"
                        >
                          {base.id &&
                          botConfigMap &&
                          staffMap &&
                          botConfigMap[base.id]
                            ? staffMap[botConfigMap[base.id][0]?.botId ?? -2]
                                ?.realName
                            : '未关联到机器人账号'}
                        </Typography>
                        <Divider
                          orientation="vertical"
                          flexItem
                          style={{ marginLeft: '5px', marginRight: '5px' }}
                        />
                        <Typography
                          variant="body2"
                          color="textSecondary"
                          display="inline"
                        >
                          {base.description}
                        </Typography>
                      </Grid>
                    )}
                  />
                </ListItem>
              }
              onContextMenu={(event) =>
                handleContextMenuOpen(event, 'Knowladge', base)
              }
            >
              {base.categoryList &&
                buildTopicCategory(
                  base.categoryList,
                  handleContextMenuOpen,
                  selectTC
                )}
            </StyledTreeItem>
          ))}
      </TreeView>
    </>
  );
});
