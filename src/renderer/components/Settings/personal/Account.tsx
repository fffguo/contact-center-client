import { useSelector, useDispatch } from 'react-redux';

import { makeStyles, Theme, createStyles } from '@material-ui/core';

import { getMyself, setStaff } from 'renderer/state/staff/staffAction';
import StaffForm from 'renderer/components/StaffForm/StaffForm';
import Staff from 'renderer/domain/StaffInfo';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      maxWidth: '500px',
      margin: theme.spacing(0, 5, 0),
    },
  })
);

export default function Account() {
  const classes = useStyles();
  const dispatch = useDispatch();
  const mySelf = useSelector(getMyself);

  function mutationCallback(staff: Staff) {
    dispatch(setStaff(staff));
  }
  return (
    <div className={classes.root}>
      <StaffForm defaultValues={mySelf} mutationCallback={mutationCallback} />
    </div>
  );
}
