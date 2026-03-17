import OrderCard from "./OrderCard";

export default function KitchenQueue({ title, orders, footerRenderer }) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500">{orders.length} orders in this lane</p>
      </div>
      <div className="space-y-4">
        {orders.map((order) => (
          <OrderCard key={order._id} order={order} footer={footerRenderer?.(order)} />
        ))}
      </div>
    </section>
  );
}
