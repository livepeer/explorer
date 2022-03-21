import { getLayout } from "@layouts/main";
import AccountLayout from "@layouts/account";

const Delegating = () => <AccountLayout />;

Delegating.getLayout = getLayout;

export default Delegating;
