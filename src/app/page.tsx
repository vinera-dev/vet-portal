export default function Home() {
  return (
    <>
      <h1>Vet Portal</h1>
      <p>
        Welcome to the portal of a fictional veterinary clinic. Book an appointment, manage an
        existing one, or ask the clinic assistant a question.
      </p>
      <section aria-labelledby="hours-heading">
        <h2 id="hours-heading">Opening hours</h2>
        <ul>
          <li>Monday to Saturday: 08:00 to 18:00</li>
          <li>Sunday: closed</li>
        </ul>
        <p>Appointments are 30 minutes long.</p>
      </section>
    </>
  );
}
