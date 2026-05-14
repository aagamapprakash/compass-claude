import TripForm from '../TripForm';

export default function TripFormExample() {
  return (
    <TripForm 
      onSubmit={(data) => console.log('Trip submitted:', data)} 
      isLoading={false}
    />
  );
}
