import AccountLayout from "@layouts/account";
import { getLayout } from "@layouts/main";

const BroadcastingPage = () => <AccountLayout />;

BroadcastingPage.getLayout = getLayout;

export default BroadcastingPage;
