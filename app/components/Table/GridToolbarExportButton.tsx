import React, { forwardRef, useState } from 'react';
import PropTypes from 'prop-types';

import { GridMenu, GridSaveAltIcon } from '@material-ui/data-grid';
import { Button, MenuItem, MenuList } from '@material-ui/core';

export interface GridToolbarDataProps {
  exportToExcel: () => void;
}

export const GridToolbarExportButton = forwardRef<
  HTMLButtonElement,
  GridToolbarDataProps
>(function GridToolbarDataButton(props, ref) {
  const { exportToExcel } = props;
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement>();

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) =>
    setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(undefined);

  const handleExport = () => {
    // 导出成 Excel
    exportToExcel();
    setAnchorEl(undefined);
  };

  const handleListKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Tab') {
      event.preventDefault();
    }
    if (event.key === 'Tab' || event.key === 'Escape') {
      handleMenuClose();
    }
  };
  return (
    <>
      <Button
        ref={ref}
        color="primary"
        size="small"
        startIcon={<GridSaveAltIcon />}
        onClick={handleMenuOpen}
        aria-expanded={anchorEl ? 'true' : undefined}
        aria-label="数据"
        aria-haspopup="menu"
      >
        导出
      </Button>
      <GridMenu
        open={Boolean(anchorEl)}
        target={anchorEl}
        onClickAway={handleMenuClose}
        position="bottom-start"
      >
        <MenuList
          className="MuiDataGrid-gridMenuList"
          onKeyDown={handleListKeyDown}
          autoFocusItem={Boolean(anchorEl)}
        >
          <MenuItem onClick={handleExport}>导出至Excel</MenuItem>
        </MenuList>
      </GridMenu>
    </>
  );
});

GridToolbarExportButton.propTypes = {
  exportToExcel: PropTypes.func.isRequired,
};