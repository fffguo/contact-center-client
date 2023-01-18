import { AppThunk, RootState } from 'renderer/store';

import slice from './chatSlice';

export const {
  setQuickReply,
  setMonitoredMessage,
  setMonitorSelectedSession,
  setSelectedSessionNumber,
  setTransferMessageRecive,
  setTransferMessageToSend,
  removeTransferMessageToSend,
  removeTransferMessageRecive,
  setPts,
  setPlayNewMessageSound,
  clearPlayNewMessageSound,
  addImageToSend,
  clearImageToSend,
} = slice.actions;

export const getSelectedSession = (state: RootState) => {
  const { monitored } = state.chat;
  const { selectedSession } = state.chat;
  if (selectedSession) {
    if (
      monitored &&
      selectedSession === monitored.monitoredSession?.conversation.userId
    ) {
      return monitored.monitoredSession;
    }
    return state.session[selectedSession];
  }
  return undefined;
};

export const getMonitor = (state: RootState) => state.chat.monitored;

export const getQuickReply = (state: RootState) => state.chat.quickReply;
export const getFilterQuickReply = (state: RootState) =>
  state.chat.filterQuickReply;

export const getSelectedConv = (state: RootState) =>
  getSelectedSession(state)?.conversation;

export const getSelectedConstomer = (state: RootState) =>
  getSelectedSession(state)?.user;

export const getFirstTransferMessageRecive = (state: RootState) =>
  state.chat.transferMessageRecive && state.chat.transferMessageRecive[0];

export const getPlayNewMessageSound = (state: RootState) =>
  state.chat.playNewMessageSound;

export const getImageListToSend = (state: RootState) =>
  state.chat.imageListToSend;
