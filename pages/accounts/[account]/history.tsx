import { getLayout } from "@layouts/main";
import AccountLayout from "@layouts/account";
import HistoryView from "@components/HistoryView";

const History = () => {
  return (
    <AccountLayout>
      <HistoryView />
    </AccountLayout>
  );
};

History.getLayout = getLayout;

export default History;
