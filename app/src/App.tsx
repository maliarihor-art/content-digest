import { greeting } from './greeting';

export default function App() {
  return (
    <main style={{ fontFamily: 'system-ui', padding: '2rem' }}>
      <h1>{greeting('my-webapp')}</h1>
      <p>A sandbox to learn and prototype web app features.</p>
    </main>
  );
}
