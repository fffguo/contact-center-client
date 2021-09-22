/* eslint-disable react/jsx-props-no-spreading */
import React, { forwardRef, useRef, useState } from 'react';
import _ from 'lodash';

import { createStyles, makeStyles } from '@material-ui/core/styles';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import InsertEmoticonOutlinedIcon from '@material-ui/icons/InsertEmoticonOutlined';
import AttachmentOutlinedIcon from '@material-ui/icons/AttachmentOutlined';
import ImageOutlinedIcon from '@material-ui/icons/ImageOutlined';
import LaunchOutlinedIcon from '@material-ui/icons/LaunchOutlined';
import PersonAddOutlinedIcon from '@material-ui/icons/PersonAddOutlined';
import SpeakerNotesOffIcon from '@material-ui/icons/SpeakerNotesOff';
import StarIcon from '@material-ui/icons/Star';
import Tooltip from '@material-ui/core/Tooltip';
import Popper, { PopperPlacementType } from '@material-ui/core/Popper';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';

import './emoji-mart.global.css';
import { Picker, BaseEmoji } from 'emoji-mart';
import Upload from 'rc-upload';
import { RcFile } from 'rc-upload/lib/interface';

import config from 'app/config/clientConfig';
import { PhotoContent } from 'app/domain/Message';
import BlacklistForm from 'app/components/Blacklist/BlacklistForm';
import DraggableDialog, {
  DraggableDialogRef,
} from 'app/components/DraggableDialog/DraggableDialog';
import { BlacklistFormProp } from 'app/domain/Blacklist';

const useStyles = makeStyles(() =>
  createStyles({
    toolBar: {
      minHeight: 30,
      background: '#222',
      borderRightStyle: 'solid',
      borderLeftStyle: 'solid',
      borderWidth: 1,
      // 是否将按钮调中间
      // justifyContent: 'center',
    },
    popper: {
      zIndex: 1,
    },
  })
);

interface EditorProps {
  textMessage: string;
  setMessage(msg: string): void;
  sendImageMessage(photoContent: PhotoContent): void;
  blacklistInfo: BlacklistFormProp;
}

function EditorTool(props: EditorProps, ref: React.Ref<HTMLDivElement>) {
  const classes = useStyles();
  const { textMessage, setMessage, sendImageMessage, blacklistInfo } = props;

  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement>();
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<PopperPlacementType>();
  const refOfDialog = useRef<DraggableDialogRef>(null);

  function handleClickBlacklist() {
    refOfDialog.current?.setOpen(true);
  }

  const handleClick =
    (newPlacement: PopperPlacementType) =>
    (event: React.MouseEvent<HTMLButtonElement>) => {
      setAnchorEl(event.currentTarget);
      setOpen((prev) => placement !== newPlacement || !prev);
      setPlacement(newPlacement);
    };

  const onClose = () => setOpen(false);

  const addEmoji = (emojiData: BaseEmoji) => {
    const emoji = emojiData.native;
    setMessage(textMessage + emoji);
    onClose();
  };

  const imgUploadProps = {
    action: `${config.web.host}${config.oss.path}/chat/img`,
    multiple: false,
    accept: 'image/png,image/gif,image/jpeg',
    onStart(file: RcFile) {
      console.log('onStart', file, file.name);
    },
    onSuccess(response: unknown, file: RcFile, _xhr: unknown) {
      console.log('onSuccess', response);
      // 发送图片消息
      sendImageMessage({
        mediaId: (response as string[])[0],
        filename: file.name,
        picSize: file.size,
        type: file.type,
      });
    },
    onError(error: Error, _ret: any, _file: RcFile) {
      console.log('onError', error);
    },
  };

  const fileUploadProps = _.clone(imgUploadProps);
  fileUploadProps.action = `${config.web.host}/${config.oss.path}/chat/file`;
  fileUploadProps.accept = '*';

  return (
    <Toolbar className={classes.toolBar} ref={ref}>
      <DraggableDialog title="添加黑名单" ref={refOfDialog}>
        <BlacklistForm defaultValues={blacklistInfo} />
      </DraggableDialog>
      <Popper
        open={open}
        anchorEl={anchorEl}
        placement={placement}
        transition
        className={classes.popper}
      >
        {() => (
          // { TransitionProps }
          // 不使用延迟
          // <Fade {...TransitionProps} timeout={350}>
          <ClickAwayListener onClickAway={onClose}>
            <Picker onSelect={addEmoji} title="emoji" theme={'dark'} />
          </ClickAwayListener>
          // </Fade>
        )}
      </Popper>
      <IconButton
        onClick={handleClick('top-start')}
        aria-label="emoji"
        disabled={false}
        color="primary"
        size="small"
      >
        <InsertEmoticonOutlinedIcon />
      </IconButton>
      {/* <Upload {...fileUploadProps}>
        <IconButton aria-label="upload file" size="small">
          <AttachmentOutlinedIcon />
        </IconButton>
      </Upload> */}
      <Upload {...imgUploadProps}>
        <IconButton color="secondary" aria-label="upload image" size="small">
          <ImageOutlinedIcon />
        </IconButton>
      </Upload>
      {/* <Tooltip title="转接">
        <IconButton color="primary" aria-label="transfer" size="small">
          <LaunchOutlinedIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="邀请">
        <IconButton color="primary" aria-label="invite" size="small">
          <PersonAddOutlinedIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="评价">
        <IconButton color="primary" aria-label="evaluate" size="small">
          <StarIcon />
        </IconButton>
      </Tooltip> */}
      <Tooltip title="拉黑">
        <IconButton
          color="secondary"
          aria-label="evaluate"
          size="small"
          onClick={handleClickBlacklist}
        >
          <SpeakerNotesOffIcon />
        </IconButton>
      </Tooltip>
    </Toolbar>
  );
}

export default forwardRef<HTMLDivElement, EditorProps>(EditorTool);
