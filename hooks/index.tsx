import { gql, useApolloClient, useMutation, useQuery } from "@apollo/client";
import { useEffect, useRef, useState } from "react";
import { transactionsQuery } from "../queries/transactionsQuery";
import { useAccountAddress, useAccountSigner } from "./wallet";

export * from "./wallet";

export function useWeb3Mutation(mutation, options) {
  const client: any = useApolloClient();
  const accountAddress = useAccountAddress();
  const [mutate, { data, loading: dataLoading }] = useMutation(mutation, {
    ...options,
  });
  const GET_TRANSACTION_STATUS = gql`
    query getTxReceiptStatus($txHash: String) {
      getTxReceiptStatus(txHash: $txHash) {
        status
      }
    }
  `;

  const { data: transactionStatusData, loading: transactionStatusLoading } =
    useQuery(GET_TRANSACTION_STATUS, {
      ...options,
      variables: {
        txHash: data?.tx?.txHash,
      },
      fetchPolicy: "no-cache",
      notifyOnNetworkStatusChange: true,
      context: options?.context,
    });

  const { data: transactionsData } = useQuery(transactionsQuery);

  useEffect(() => {
    if (data) {
      const previousTxs = transactionsData?.txs?.filter(
        (t) => t.txHash !== data.tx.txHash
      );
      client.writeQuery({
        query: gql`
          query {
            txs
          }
        `,
        data: {
          txs: [
            ...(transactionsData ? previousTxs : []),
            {
              __typename: mutation.definitions[0].name.value,
              txHash: data.tx?.txHash,
              from: accountAddress,
              inputData: JSON.stringify(data.tx.inputData),
              confirmed: !!transactionStatusData?.getTxReceiptStatus?.status,
            },
          ],
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataLoading, transactionStatusLoading]);
  return {
    mutate,
  };
}

// modified from https://usehooks.com/usePrevious/
export function usePrevious(value) {
  // The ref object is a generic container whose current property is mutable ...
  // ... and can hold any value, similar to an instance property on a class
  const ref = useRef();

  // Store current value in ref
  useEffect(() => {
    ref.current = value;
  }, [value]); // Only re-run if value changes

  // Return previous value (happens before update in useEffect above)
  return ref.current;
}

export function useMutations() {
  const mutations = require("../mutations").default;
  const accountAddress = useAccountAddress();
  const accountSigner = useAccountSigner();
  const mutationsObj = {};
  for (const key in mutations) {
    /* eslint-disable-next-line react-hooks/rules-of-hooks */
    const { mutate } = useWeb3Mutation(mutations[key], {
      context: {
        account: accountAddress,
        signer: accountSigner,
      },
    });
    mutationsObj[key] = mutate;
  }
  return mutationsObj;
}

export function getBrowserVisibilityProp() {
  if (typeof document.hidden !== "undefined") {
    // Opera 12.10 and Firefox 18 and later support
    return "visibilitychange";
  } else if (typeof document["msHidden"] !== "undefined") {
    return "msvisibilitychange";
  } else if (typeof document["webkitHidden"] !== "undefined") {
    return "webkitvisibilitychange";
  }
}
export function getBrowserDocumentHiddenProp() {
  if (typeof document.hidden !== "undefined") {
    return "hidden";
  } else if (typeof document["msHidden"] !== "undefined") {
    return "msHidden";
  } else if (typeof document["webkitHidden"] !== "undefined") {
    return "webkitHidden";
  }
}

export function getIsDocumentVisible() {
  return !process.browser || !document[getBrowserDocumentHiddenProp()];
}

export function usePageVisibility() {
  const [isVisible, setIsVisible] = useState(getIsDocumentVisible());
  const onVisibilityChange = () => setIsVisible(getIsDocumentVisible());
  useEffect(() => {
    const visibilityChange = getBrowserVisibilityProp();
    document.addEventListener(visibilityChange, onVisibilityChange, false);
    return () => {
      document.removeEventListener(visibilityChange, onVisibilityChange);
    };
  });
  return isVisible;
}

export function useComponentDidMount(func: () => any) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(func, []);
}

export function useComponentWillMount(func: () => any) {
  const willMount = useRef(true);

  if (willMount.current) {
    func();
  }

  useComponentDidMount(() => {
    willMount.current = false;
  });
}

export function useOnClickOutside(ref, handler) {
  useEffect(
    () => {
      const listener = (event) => {
        // Do nothing if clicking ref's element or descendent elements
        if (!ref.current || ref.current.contains(event.target)) {
          return;
        }

        handler(event);
      };

      document.addEventListener("mousedown", listener);
      document.addEventListener("touchstart", listener);

      return () => {
        document.removeEventListener("mousedown", listener);
        document.removeEventListener("touchstart", listener);
      };
    },
    // Add ref and handler to effect dependencies
    // It's worth noting that because passed in handler is a new ...
    // ... function on every render that will cause this effect ...
    // ... callback/cleanup to run every render. It's not a big deal ...
    // ... but to optimize you can wrap handler in useCallback before ...
    // ... passing it into this hook.
    [ref, handler]
  );
}
