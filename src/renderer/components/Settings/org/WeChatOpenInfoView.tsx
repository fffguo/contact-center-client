import { useMemo, useRef, useState } from 'react';
import _ from 'lodash';

import { gql, useMutation, useQuery } from '@apollo/client';

import {
  DataGrid,
  GridCellParams,
  GridColDef,
  GridRowId,
  GridValueGetterParams,
} from '@material-ui/data-grid';

import GRID_DEFAULT_LOCALE_TEXT from 'renderer/variables/gridLocaleText';
import DraggableDialog, {
  DraggableDialogRef,
} from 'renderer/components/DraggableDialog/DraggableDialog';
import { CustomerGridToolbarCreater } from 'renderer/components/Table/CustomerGridToolbar';
import useAlert from 'renderer/hook/alert/useAlert';
import {
  MUTATION_WECHAT_INFO,
  QUERY_WECHAT_INFO,
  UpdateWeChatOpenInfoGraphql,
  WeChatOpenInfo,
  WeChatOpenInfoGraphql,
} from 'renderer/domain/WeChatOpenInfo';
import { StaffShuntList } from 'renderer/domain/graphql/Staff';
import { Button, ButtonGroup } from '@material-ui/core';
import clientConfig from 'renderer/config/clientConfig';
import { getMyself } from 'renderer/state/staff/staffAction';
import { useAppSelector } from 'renderer/store';
import javaInstant2DateStr from 'renderer/utils/timeUtils';
import WeChatOpenInfoForm from './form/WeChatOpenInfoForm';

type Graphql = WeChatOpenInfoGraphql;

const QUERY_SHUNT = gql`
  query Shunt {
    allStaffShunt {
      code
      id
      name
      organizationId
      shuntClassId
      openPush
      authorizationToken
    }
  }
`;

export default function WeChatOpenInfoView() {
  const mySelf = useAppSelector(getMyself);

  const [weChatOpenInfo, setWeChatOpenInfo] = useState<WeChatOpenInfo>();
  const [selectionModel, setSelectionModel] = useState<GridRowId[]>([]);
  const refOfDialog = useRef<DraggableDialogRef>(null);
  const { loading, data, refetch } = useQuery<Graphql>(QUERY_WECHAT_INFO);

  const { onLoadding, onCompleted, onError } = useAlert();

  const { data: staffShunt } = useQuery<StaffShuntList>(QUERY_SHUNT, {
    onError,
  });

  const [updateWeChatOpenInfo, { loading: updateLoading }] =
    useMutation<UpdateWeChatOpenInfoGraphql>(MUTATION_WECHAT_INFO, {
      onCompleted,
      onError,
    });
  if (updateLoading) {
    onLoadding(updateLoading);
  }

  const handleClickOpen = (selectWeChatOpenInfo: WeChatOpenInfo) => {
    setWeChatOpenInfo(selectWeChatOpenInfo);
    refOfDialog.current?.setOpen(true);
  };

  const shuntList = staffShunt?.allStaffShunt ?? [];
  const shuntMap = _.groupBy(shuntList, 'id');
  const rows = data?.getAllWeChatOpenInfo ?? [];
  rows.forEach((it) => {
    if (it.shuntId) {
      const [shunt] = shuntMap[it.shuntId];
      it.shuntName = shunt.name;
    }
  });

  const columns: GridColDef[] = useMemo(() => {
    async function toggleWeChatOpenInfo(
      value: WeChatOpenInfo,
      isEnable = true
    ) {
      const tempWeChatOpenInfo = _.omit(value, '__typename');
      if (isEnable) {
        tempWeChatOpenInfo.enable = !tempWeChatOpenInfo.enable;
      } else {
        tempWeChatOpenInfo.remove = !tempWeChatOpenInfo.remove;
      }
      await updateWeChatOpenInfo({
        variables: { weChatOpenInfo: tempWeChatOpenInfo },
      });
      refetch();
    }

    return [
      // { field: 'id', headerName: 'ID', width: 90 },
      { field: 'nickName', headerName: '微信公众号', width: 250 },
      {
        field: 'enable',
        headerName: '状态',
        width: 250,
        valueGetter: (params: GridValueGetterParams) => {
          const enable = params.value;
          return enable ? '启用' : '停用';
        },
      },
      {
        field: 'bindingTime',
        headerName: '绑定时间',
        width: 250,
        valueGetter: (params: GridValueGetterParams) => {
          return params.value
            ? javaInstant2DateStr(params.value as number)
            : null;
        },
      },
      {
        field: 'operation',
        headerName: '操作',
        width: 250,
        renderCell: function ColorIcon(params: GridCellParams) {
          const { row } = params;
          const cellWeChatOpenInfo = row as WeChatOpenInfo;
          return (
            <ButtonGroup color="primary" aria-label="wechat add">
              <Button
                size="medium"
                onClick={(event) => {
                  handleClickOpen(cellWeChatOpenInfo);
                  event.preventDefault();
                  return false;
                }}
              >
                关联到接待组
              </Button>
              <Button
                size="medium"
                onClick={(event) => {
                  toggleWeChatOpenInfo(cellWeChatOpenInfo);
                  event.preventDefault();
                  return false;
                }}
              >
                {cellWeChatOpenInfo.enable ? '停用' : '启用'}
              </Button>
              <Button
                size="medium"
                onClick={(event) => {
                  toggleWeChatOpenInfo(cellWeChatOpenInfo, false);
                  event.preventDefault();
                  return false;
                }}
              >
                解绑
              </Button>
            </ButtonGroup>
          );
        },
      },
    ];
  }, [refetch, updateWeChatOpenInfo]);

  return (
    <>
      <DraggableDialog title="关联接待组" ref={refOfDialog}>
        <WeChatOpenInfoForm
          defaultValues={weChatOpenInfo}
          refetch={refetch}
          shuntList={shuntList}
        />
      </DraggableDialog>
      <ButtonGroup color="primary" aria-label="wechat add">
        <Button
          onClick={() => {
            window.open(
              `${clientConfig.web.host}/wechat/api/auth/auth_url_page?org_id=${mySelf.organizationId}`,
              '_blank',
              'electron:true'
            );
          }}
        >
          绑定公众号
        </Button>
        {/* <Button>绑定小程序</Button> */}
      </ButtonGroup>
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
        rowsPerPageOptions={[20]}
        pagination
        pageSize={20}
        loading={loading}
        disableSelectionOnClick
        checkboxSelection
        onSelectionModelChange={(selectionId: GridRowId[]) => {
          setSelectionModel(selectionId);
        }}
        selectionModel={selectionModel}
      />
    </>
  );
}
