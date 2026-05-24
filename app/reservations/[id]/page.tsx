import { ReservationCheckout } from "@/components/reservations/reservation-checkout";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ReservationPage({ params }: PageProps) {
  const { id } = await params;

  return <ReservationCheckout reservationId={id} />;
}
