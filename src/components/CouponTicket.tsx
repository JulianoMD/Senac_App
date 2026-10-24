import type { Coupon } from "../data";
import Barcode from "./Barcode";
import Photo from "./Photo";

export default function CouponTicket({ coupon }: { coupon: Coupon }) {
  return (
    <div className="ticket">
      <div className="ticket-top">
        <span className="ticket-handle" aria-hidden="true" />
        <p className="ticket-category">{coupon.category}</p>
        <h2 className="ticket-value">{coupon.value}</h2>
        <div className="ticket-photo">
          <Photo src={coupon.image} eager />
        </div>
        <div className="ticket-band ticket-band--center">
          <p className="ticket-days">
            <strong>{coupon.daysLeft}</strong> dias restantes
          </p>
          <p>Use este cupom em qualquer uma das</p>
          <p className="ticket-brand">Cantinas Senac</p>
          <p className="ticket-link">unidades participantes</p>
        </div>
      </div>
      <div className="ticket-stub">
        <Barcode code={coupon.ean} className="barcode--large" barHeight={36} />
        <p>Use na hora de pagar pelo app, em Cupom de desconto</p>
      </div>
    </div>
  );
}
