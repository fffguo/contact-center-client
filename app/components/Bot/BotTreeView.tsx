import React from 'react';

import { v4 as uuidv4 } from 'uuid';

import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import TreeView from '@material-ui/lab/TreeView';
import SubjectIcon from '@material-ui/icons/Subject';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ArrowRightIcon from '@material-ui/icons/ArrowRight';

import { KnowledgeBase, TopicCategory } from 'app/domain/Bot';
import StyledTreeItem from 'app/components/TreeView/StyledTreeItem';
import { TopicOrKnowladgeKey } from 'app/components/Bot/TopicAndKnowladgeContainer';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      flexGrow: 1,
    },
    toolBar: {
      minHeight: 30,
      background: 'white',
      borderRightStyle: 'solid',
      borderLeftStyle: 'solid',
      borderWidth: 1,
      // 是否将按钮调中间
      // justifyContent: 'center',
    },
    menuButton: {
      marginRight: theme.spacing(2),
    },
    list: {
      width: '100%',
      height: '80vh',
      backgroundColor: theme.palette.background.paper,
    },
  })
);

interface BotTreeViewProps {
  allKnowledgeBase: KnowledgeBase[];
  setOnContextMenu: (
    event: React.MouseEvent<HTMLLIElement>,
    topicOrKnowladgeKey: TopicOrKnowladgeKey,
    knowledgeBase?: KnowledgeBase,
    topicCategory?: TopicCategory
  ) => void;
}

function buildTopicCategory(
  topicCategoryList: TopicCategory[],
  onContextMenu?: (
    event: React.MouseEvent<HTMLLIElement>,
    type: TopicOrKnowladgeKey,
    knowledgeBase?: KnowledgeBase | undefined,
    topicCategory?: TopicCategory | undefined
  ) => void
) {
  return topicCategoryList.map((cl) => (
    <StyledTreeItem
      key={cl.id?.toString()}
      nodeId={uuidv4()}
      labelText={`${cl.id}: ${cl.name}`}
      labelIcon={SubjectIcon}
      onContextMenu={(event) => {
        if (onContextMenu) {
          onContextMenu(event, 'Topic', undefined, cl);
        }
      }}
    >
      {cl.children && buildTopicCategory(cl.children)}
    </StyledTreeItem>
  ));
}

export default React.memo(function BotTreeView(props: BotTreeViewProps) {
  const { allKnowledgeBase, setOnContextMenu } = props;
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
        defaultCollapseIcon={<ArrowDropDownIcon />}
        defaultExpandIcon={<ArrowRightIcon />}
      >
        {allKnowledgeBase &&
          allKnowledgeBase.map((base: KnowledgeBase) => (
            <StyledTreeItem
              key={base.id?.toString()}
              nodeId={uuidv4()}
              labelText={`${base.id}: ${base.name}`}
              labelIcon={SubjectIcon}
              onContextMenu={(event) =>
                handleContextMenuOpen(event, 'Knowladge', base)
              }
            >
              {base.categoryList &&
                buildTopicCategory(base.categoryList, handleContextMenuOpen)}
            </StyledTreeItem>
          ))}
      </TreeView>
    </>
  );
});
