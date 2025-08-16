import React, { useEffect, useState } from 'react';
import { api } from '../lib/apiClient.js';

export default function Dashboard() {
  const [me, setMe] = useState(null);
  useEffect(() => { api.me().then(setMe).catch(() => {}); }, []);
  return (
    <section>
      <h1>Dashboard</h1>
      <pre>{JSON.stringify(me, null, 2)}</pre>
    </section>
  );
}
