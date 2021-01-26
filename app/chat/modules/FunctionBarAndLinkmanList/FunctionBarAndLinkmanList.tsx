import React, { useState } from 'react';
import { useSelector } from 'react-redux';

import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import ChatIcon from '@material-ui/icons/Chat';
import HistoryIcon from '@material-ui/icons/History';
import PeopleAltIcon from '@material-ui/icons/PeopleAlt';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';

import Authorized from 'app/utils/Authorized';
import useIsLogin from '../../hooks/useIsLogin';
import useAction from '../../hooks/useAction';
import FunctionBar from './FunctionBar';
import LinkmanList from './LinkmanList';

import Style from './FunctionBarAndLinkmanList.less';
import { RootState } from '../../../store';
import useAero from '../../hooks/useAero';

function a11yProps(index: number) {
  return {
    id: `scrollable-force-tab-${index}`,
    'aria-controls': `scrollable-force-tabpanel-${index}`,
  };
}

interface TabPanelProps {
  children: React.ReactNode | undefined;
  index: any;
  value: any;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`scrollable-force-tabpanel-${index}`}
      aria-labelledby={`scrollable-force-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box p={3}>
          <Typography component="span">{children}</Typography>
        </Box>
      )}
    </div>
  );
}

function FunctionBarAndLinkmanList() {
  const [value, setValue] = useState(0);
  const isLogin = useIsLogin();
  const action = useAction();
  const functionBarAndLinkmanListVisible = useSelector(
    (state: RootState) => state.chat.status.functionBarAndLinkmanListVisible
  );
  const aero = useAero();

  const style = {
    minWidth: 'calc(100% / 3)',
  };

  if (!functionBarAndLinkmanListVisible) {
    return null;
  }

  function handleClick(e: { target: any; currentTarget: any }) {
    if (e.target === e.currentTarget) {
      action.setStatus('functionBarAndLinkmanListVisible', false);
    }
  }

  const handleChange = (
    event: React.ChangeEvent<unknown>,
    newValue: number
  ) => {
    setValue(newValue);
    event.preventDefault();
  };

  return (
    <div
      className={Style.functionBarAndLinkmanList}
      onClick={handleClick}
      onKeyDown={handleClick}
      role="button"
      tabIndex={0}
    >
      <div className={Style.container} {...aero}>
        {isLogin && <FunctionBar />}
        <FunctionBar />
        <Tabs
          value={value}
          onChange={handleChange}
          variant="scrollable"
          scrollButtons="off"
          aria-label="scrollable prevent tabs example"
        >
          <Tab
            style={style}
            icon={<ChatIcon />}
            aria-label="chat"
            {...a11yProps(0)}
          />
          <Tab
            style={style}
            icon={<HistoryIcon />}
            aria-label="history"
            {...a11yProps(1)}
          />
          <Tab
            style={style}
            icon={<PeopleAltIcon />}
            aria-label="colleague"
            {...a11yProps(2)}
          />
        </Tabs>
        <TabPanel value={value} index={0}>
          <LinkmanList history={false} />
        </TabPanel>
        <TabPanel value={value} index={1}>
          <LinkmanList history />
        </TabPanel>
        <TabPanel value={value} index={2}>
          <Authorized authority={['ROLE_ADMIN']} noMatch="非 Admin权限">
            {/* 添加权限的Dom */}
            Admin 时权限展示
          </Authorized>
        </TabPanel>
      </div>
    </div>
  );
}

export default FunctionBarAndLinkmanList;
