import { AppThunk, RootState } from 'app/store';
import { setAuthority } from 'app/utils/authority';
import { getCurrentStaff } from 'app/service/infoService';
import { configFromStaff } from 'app/domain/StaffInfo';
import { AccessToken } from 'app/domain/OauthToken';
import { register } from 'app/service/socketService';
import slice from './staffSlice';

const { setStaff, setOnline } = slice.actions;
export const getStaff = (state: RootState) => state.user;

// 异步请求
export const setUserAsync = (token: AccessToken): AppThunk => async (
  dispatch
) => {
  setAuthority(
    token.authorities.map((role) => role.substring(5).toLowerCase())
  );
  // dispatch() dispatch 等待动画
  const staff = await getCurrentStaff();
  dispatch(setStaff(staff));
};

export const configStaff = (): AppThunk => {
  return async (dispatch, getState) => {
    // 注册websocket 已经通过握手数据进行 jwt认证，直接注册客服状态
    const staff = getStaff(getState()); // useSelector(getStaff);
    register(configFromStaff(staff)).subscribe(() => {
      // 注册成功, 设置状态同步成功
      dispatch(setOnline());
    });
  };
};
