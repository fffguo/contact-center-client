import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { of } from 'rxjs';
import { map, switchMap, filter } from 'rxjs/operators';
import _ from 'lodash';

import { ConverMap, Conver } from 'app/domain/Conver';
import { MessagesMap } from 'app/domain/Message';

const initConver = {} as ConverMap;

const converSlice = createSlice({
  name: 'conversation',
  initialState: initConver,
  // createReducer 接收一个代理状态，该状态将所有突变转换为等效的复制操作。
  reducers: {
    // 设置新会话
    newConver: (converMap, action: PayloadAction<Conver>) => {
      converMap[action.payload.conversation.userId] = action.payload;
    },
    stickyCustomer: (converMap, action: PayloadAction<number>) => {
      // 设置置顶
      const conver = converMap[action.payload];
      conver.sticky = !conver.sticky;
    },
    newMessage: (converMap, action: PayloadAction<MessagesMap>) => {
      // 设置新消息
      of(action.payload)
        .pipe(
          switchMap((m) => {
            const { from } = _.valuesIn(m)[0];
            return of(from).pipe(
              filter((f) => f !== undefined && f !== null),
              map((f) => converMap[f!]),
              map((c) => {
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
