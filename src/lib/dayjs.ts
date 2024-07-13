import localizedFormat from 'dayjs/plugin/localizedFormat'
import dayjs, { Dayjs } from "dayjs";
import 'dayjs/locale/pt-br'

dayjs.locale('pt-br')
dayjs.extend(localizedFormat)


export { dayjs }