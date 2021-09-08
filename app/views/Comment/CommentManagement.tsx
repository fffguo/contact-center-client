import React, { useState } from 'react';

import _ from 'lodash';
import clsx from 'clsx';
import { useQuery } from '@apollo/client';

import DateFnsUtils from '@date-io/date-fns';
import { DataGrid, GridColDef, GridRowId } from '@material-ui/data-grid';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Button from '@material-ui/core/Button';
import Draggable from 'react-draggable';
import Paper, { PaperProps } from '@material-ui/core/Paper';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import RotateLeftIcon from '@material-ui/icons/RotateLeft';
import SearchIcon from '@material-ui/icons/Search';

import GRID_DEFAULT_LOCALE_TEXT from 'app/variables/gridLocaleText';
import {
  Card,
  CardActions,
  Checkbox,
  Collapse,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
} from '@material-ui/core';
import { Customer } from 'app/domain/Customer';
import CustomerForm, {
  CustomerFormValues,
} from 'app/components/Chat/DetailCard/panel/CustomerForm';
import { CustomerGridToolbarCreater } from 'app/components/Table/CustomerGridToolbar';
import { useSearchFormStyles } from 'app/components/SearchForm/SearchForm';
import { PageParam } from 'app/domain/graphql/Query';
import { CommentGraphql, QUERY_COMMENT } from 'app/domain/graphql/Comment';
import { CommentQuery } from 'app/domain/Comment';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import {
  MuiPickersUtilsProvider,
  KeyboardDateTimePicker,
} from '@material-ui/pickers';

const columns: GridColDef[] = [
  { field: 'id', headerName: 'ID', width: 90 },
  { field: 'createdAt', headerName: '用户标识', width: 150 },
  { field: 'shuntId', headerName: '接待组', width: 150 },
  { field: 'userId', headerName: '用户ID', width: 150 },
  { field: 'uid', headerName: '用户标识', width: 150 },
  { field: 'name', headerName: '用户姓名', width: 150 },
  { field: 'mobile', headerName: '手机', width: 150 },
  { field: 'email', headerName: '邮箱', width: 150 },
  { field: 'message', headerName: '留言内容', width: 150 },
  { field: 'solved', headerName: '解决状态', width: 150 },
  { field: 'solvedWay', headerName: '解决方式', width: 150 },
  { field: 'fromPage', headerName: '来源页', width: 150 },
  { field: 'fromIp', headerName: '来源IP', width: 150 },
  { field: 'responsible', headerName: '责任客服', width: 150 },
];

function PaperComponent(props: PaperProps) {
  return (
    <Draggable
      handle="#draggable-dialog-title"
      cancel={'[class*="MuiDialogContent-root"]'}
    >
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <Paper {...props} />
    </Draggable>
  );
}

type Graphql = CommentGraphql;
const QUERY = QUERY_COMMENT;

const dateFnsUtils = new DateFnsUtils();

const defaultValue = {
  page: new PageParam(),
  timeRange: {
    from: dateFnsUtils.format(
      dateFnsUtils.startOfMonth(new Date()),
      "yyyy-MM-dd'T'HH:mm:ss.SSSXX"
    ),
    to: dateFnsUtils.format(new Date(), "yyyy-MM-dd'T'HH:mm:ss.SSSXX"),
  },
};

export default function CommentManagement() {
  const classes = useSearchFormStyles();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [selectCustomer, setSelectCustomer] = useState<
    CustomerFormValues | undefined
  >(undefined);
  const [commentQuery, setCommentQuery] = useState<CommentQuery>(defaultValue);
  const [selectionModel, setSelectionModel] = useState<GridRowId[]>([]);
  const { loading, data, refetch } = useQuery<Graphql>(QUERY, {
    variables: { commentQuery },
  });
  const { handleSubmit, reset, control } = useForm<CommentQuery>({
    defaultValues: commentQuery,
  });

  function setAndRefetch(searchParams: CommentQuery) {
    setCommentQuery(searchParams);
    refetch({ commentQuery: searchParams });
  }

  const handleClickOpen = (user: Customer) => {
    const idUser = {
      id: user.id,
      organizationId: user.organizationId,
      uid: user.uid,
      name: user.name,
      mobile: user.mobile,
      address: user.address,
      email: user.email,
      vipLevel: user.vipLevel,
      remarks: user.remarks,
      data: user.data,
    };
    setSelectCustomer(idUser);
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  const handleDialogClose = (
    _event: unknown,
    reason: 'backdropClick' | 'escapeKeyDown'
  ) => {
    if (reason !== 'backdropClick') {
      handleClose();
    }
  };

  const handlePageChange = (params: number) => {
    commentQuery.page = new PageParam(params, commentQuery.page.size);
    setAndRefetch(commentQuery);
  };
  const handlePageSizeChange = (params: number) => {
    commentQuery.page = new PageParam(commentQuery.page.page, params);
    setAndRefetch(commentQuery);
  };
  const result = data?.findComment;
  const rows = result && result.content ? result.content : [];
  const pageSize = result ? result.size : 20;
  const rowCount = result ? result.totalElements : 0;

  const setSearchParams = (searchParams: CommentQuery) => {
    searchParams.page = commentQuery.page;
    setAndRefetch(searchParams);
  };

  const onSubmit: SubmitHandler<CommentQuery> = (form) => {
    if (form.time) {
      setSearchParams(_.omit(form, 'time'));
    } else {
      setSearchParams(_.omit(form, 'time', 'timeRange'));
    }
  };

  return (
    <div style={{ height: '80vh', width: '100%' }}>
      <Dialog
        disableEnforceFocus
        fullWidth
        maxWidth="lg"
        open={open}
        onClose={handleDialogClose}
        PaperComponent={PaperComponent}
        aria-labelledby="draggable-dialog-title"
      >
        <DialogTitle style={{ cursor: 'move' }} id="draggable-dialog-title">
          详细用户信息
        </DialogTitle>
        <DialogContent>
          <CustomerForm defaultValues={selectCustomer} shouldDispatch={false} />
        </DialogContent>
        <DialogActions>
          <Button autoFocus onClick={handleClose} color="primary">
            取消
          </Button>
        </DialogActions>
      </Dialog>
      <MuiPickersUtilsProvider utils={DateFnsUtils}>
        <form noValidate autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
          {/* 老式的折叠写法，新的参考 StaffShuntForm */}
          <Card>
            <CardActions disableSpacing>
              <div className={classes.root}>
                <Controller
                  control={control}
                  defaultValue
                  name="time"
                  render={({ onChange, value }) => (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={value}
                          onChange={(e) => onChange(e.target.checked)}
                          inputProps={{ 'aria-label': 'primary checkbox' }}
                        />
                      }
                      label="时间"
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="timeRange.from"
                  render={({ onChange, value }) => (
                    <KeyboardDateTimePicker
                      disableFuture
                      variant="inline"
                      format="yyyy-MM-dd HH:mm:ss"
                      margin="normal"
                      id="date-picker-inline"
                      label="开始时间"
                      value={value}
                      onChange={(d) => {
                        if (d) {
                          onChange(
                            dateFnsUtils.format(
                              d,
                              "yyyy-MM-dd'T'HH:mm:ss.SSSXX"
                            )
                          );
                        }
                      }}
                      KeyboardButtonProps={{
                        'aria-label': 'change date',
                      }}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="timeRange.to"
                  render={({ onChange, value }) => (
                    <KeyboardDateTimePicker
                      disableFuture
                      variant="inline"
                      format="yyyy-MM-dd HH:mm:ss"
                      margin="normal"
                      id="date-picker-inline"
                      label="结束时间"
                      value={value}
                      onChange={(d) => {
                        if (d) {
                          onChange(
                            dateFnsUtils.format(
                              d,
                              "yyyy-MM-dd'T'HH:mm:ss.SSSXX"
                            )
                          );
                        }
                      }}
                      KeyboardButtonProps={{
                        'aria-label': 'change date',
                      }}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="solved"
                  defaultValue=""
                  rules={{ valueAsNumber: true }}
                  render={({ onChange, value }) => (
                    <FormControl variant="outlined" margin="normal">
                      <InputLabel id="demo-mutiple-chip-label">
                        解决状态
                      </InputLabel>
                      <Select
                        labelId="solved"
                        id="solved"
                        onChange={onChange}
                        value={value}
                        label="解决状态"
                      >
                        <MenuItem value="">
                          <em>全部</em>
                        </MenuItem>
                        <MenuItem value={0}>未解决</MenuItem>
                        <MenuItem value={1}>已解决</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
                <Controller
                  control={control}
                  name="solvedWay"
                  defaultValue=""
                  rules={{ valueAsNumber: true }}
                  render={({ onChange, value }) => (
                    <FormControl variant="outlined" margin="normal">
                      <InputLabel id="demo-mutiple-chip-label">
                        解决方式
                      </InputLabel>
                      <Select
                        labelId="solvedWay"
                        id="solvedWay"
                        onChange={onChange}
                        value={value}
                        label="解决方式"
                      >
                        <MenuItem value="">
                          <em>全部</em>
                        </MenuItem>
                        <MenuItem value={0}>手机</MenuItem>
                        <MenuItem value={1}>邮件</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </div>
              <Button
                variant="contained"
                color="secondary"
                className={classes.button}
                startIcon={<RotateLeftIcon />}
                aria-label="reset"
                onClick={() => {
                  reset(defaultValue);
                }}
              >
                重置
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                className={classes.button}
                startIcon={<SearchIcon />}
                aria-label="submit"
              >
                搜索
              </Button>
              <IconButton
                className={clsx(classes.expand, {
                  [classes.expandOpen]: expanded,
                })}
                onClick={() => {
                  setExpanded(!expanded);
                }}
                aria-expanded={expanded}
                aria-label="show more"
              >
                <ExpandMoreIcon />
              </IconButton>
            </CardActions>
            <Collapse in={expanded} timeout="auto" unmountOnExit>
              <CardActions />
            </Collapse>
          </Card>
        </form>
      </MuiPickersUtilsProvider>
      <Divider variant="inset" component="li" />
      <DataGrid
        localeText={GRID_DEFAULT_LOCALE_TEXT}
        rows={rows}
        columns={columns}
        components={{
          Toolbar: CustomerGridToolbarCreater({
            refetch: () => {
              refetch();
            },
          }),
        }}
        pagination
        pageSize={pageSize}
        // 全部的列表
        rowCount={rowCount}
        rowsPerPageOptions={[10, 20, 50, 100]}
        paginationMode="server"
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        loading={loading}
        onRowClick={(param) => {
          handleClickOpen(param.row as Customer);
        }}
        disableSelectionOnClick
        checkboxSelection
        onSelectionModelChange={(selectionId: GridRowId[]) => {
          setSelectionModel(selectionId);
        }}
        selectionModel={selectionModel}
      />
    </div>
  );
}
