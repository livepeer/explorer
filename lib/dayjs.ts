import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import localizedFormat from "dayjs/plugin/localizedFormat";
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';
import weekOfYear from "dayjs/plugin/weekOfYear";

dayjs.extend(duration);
dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.extend(localizedFormat);
dayjs.extend(weekOfYear);

export default dayjs;