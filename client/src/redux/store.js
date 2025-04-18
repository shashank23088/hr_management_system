import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import employeeReducer from './slices/employeeSlice';
import teamReducer from './slices/teamSlice';
import taskReducer from './slices/taskSlice';
import attendanceReducer from './slices/attendanceSlice';
import salaryReducer from './slices/salarySlice';
import leaveReducer from './slices/leaveSlice';
import ticketReducer from './slices/ticketSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    employees: employeeReducer,
    teams: teamReducer,
    tasks: taskReducer,
    attendance: attendanceReducer,
    salary: salaryReducer,
    leaves: leaveReducer,
    tickets: ticketReducer,
  },
}); 