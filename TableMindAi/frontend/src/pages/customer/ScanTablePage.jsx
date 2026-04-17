import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import PageHeader from "../../components/common/PageHeader";
import { createTableSessionRequest, validateTableRequest } from "../../api/tableApi";
import { useTable } from "../../hooks/useTable";
import { useToast } from "../../hooks/useToast";
import { getApiErrorMessage } from "../../utils/errors";

export default function ScanTablePage() {
  const navigate = useNavigate();
  const { restaurantId = "", tableNumber = "" } = useParams();
  const { setTableSession } = useTable();
  const { showToast } = useToast();
  const [status, setStatus] = useState("validating");
  const [message, setMessage] = useState("Checking your table QR...");

  const normalizedPayload = useMemo(
    () => ({
      restaurantId,
      tableNumber: Number(tableNumber),
    }),
    [restaurantId, tableNumber]
  );

  useEffect(() => {
    const bootstrapScan = async () => {
      if (!restaurantId || !Number.isInteger(Number(tableNumber)) || Number(tableNumber) < 1) {
        setStatus("error");
        setMessage("This QR code is invalid. Please ask staff for a new table QR.");
        return;
      }

      try {
        const validation = await validateTableRequest(normalizedPayload);

        if (!validation.valid) {
          setStatus("error");
          setMessage(validation.message);
          return;
        }

        const session = await createTableSessionRequest(normalizedPayload);
        setTableSession(session);
        showToast({
          title: "Table confirmed",
          message: `You are now ordering from Table ${session.tableNumber}.`,
          variant: "success",
        });
        navigate("/menu", { replace: true });
      } catch (error) {
        setStatus("error");
        setMessage(getApiErrorMessage(error, "Unable to start your table session from this QR code."));
      }
    };

    bootstrapScan();
  }, [navigate, normalizedPayload, restaurantId, setTableSession, showToast, tableNumber]);

  if (status === "validating") {
    return <Loader label={message} />;
  }

  return (
    <div className="mx-auto max-w-3xl rounded-[32px] border border-amber-100 bg-white p-6 shadow-[0_20px_44px_rgba(125,59,12,0.06)] sm:p-8">
      <PageHeader
        eyebrow="QR Scan"
        title="We could not start this table session"
        description={message}
      />
      <div className="mt-6 grid gap-3 sm:flex">
        <Link to="/">
          <Button className="w-full sm:w-auto">Back to Welcome</Button>
        </Link>
        <Link to="/table">
          <Button variant="secondary" className="w-full sm:w-auto">QR Help</Button>
        </Link>
      </div>
    </div>
  );
}
