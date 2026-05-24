import { ReservationSuccess } from "@/components/reservations/reservation-success";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ReservationSuccessPage({ params }: PageProps) {
  const { id } = await params;

  return <ReservationSuccess reservationId={id} />;
}
