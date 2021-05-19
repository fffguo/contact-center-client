import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { of } from 'rxjs';
import { map, switchMap, filter, defaultIfEmpty, tap } from 'rxjs/operators';
import _ from 'lodash';

import { SessionMap, Session, TagParamer } from 'app/domain/Session';
import { MessagesMap } from 'app/domain/Message';
import javaInstant2Date from 'app/utils/timeUtils';
import { Customer } from 'app/domain/Customer';

const initConver = {} as SessionMap;

const converSlice = createSlice({
  name: 'conversation',
  initialState: initConver,
  // createReducer 接收一个代理状态，该状态将所有突变转换为等效的复制操作。
  reducers: {
    // 设置新会话
    newConver: (converMap, action: PayloadAction<Session>) => {
      converMap[action.payload.conversation.userId] = action.payload;
    },
    updateCustomer: (converMap, action: PayloadAction<Customer>) => {
      converMap[action.payload.userId].user = action.payload;
    },
    stickyCustomer: (converMap, action: PayloadAction<number>) => {
      // 设置置顶
      const conver = converMap[action.payload];
      conver.sticky = !conver.sticky;
    },
    tagCustomer: (converMap, action: PayloadAction<TagParamer>) => {
      // 设置标签
      const conver = converMap[action.payload.userId];
      conver.tag = action.payload.tag;
    },
    newMessage: (converMap, action: PayloadAction<MessagesMap>) => {
      // 设置新消息
      of(action.payload)
        .pipe(
          switchMap((m) => {
            const msg = _.valuesIn(m)[0];
            const { from, to } = msg;
            return of(from).pipe(
              tap(() => {
                if (msg.createdAt) {
                  msg.createdAt = javaInstant2Date(msg.createdAt);
                }
              }),
              filter((f) => f !== undefined && f !== null),
              defaultIfEmpty<number | undefined>(to),
              filter((f) => f !== undefined && f !== null),
              map((f) => converMap[f]),
              map((c) => {
                c.lastMessageTime = msg.createdAt ?? c.lastMessageTime;
                [c.lastMessage] = _.valuesIn(m);
                // 消息如果存在了就不在设置 change from _.merge
                _.defaults(c.massageList, m);
              })
            );
          })
        )
        .subscribe();
    },
  },
});

export default converSlice;

export const { reducer } = converSlice;
