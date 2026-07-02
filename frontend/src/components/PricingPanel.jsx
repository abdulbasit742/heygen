import React, { useEffect, useState } from 'react';
import { checkoutMock, getBillingMe, listPlans } from '../api.js';

export default function PricingPanel() {
  const [plans, setPlans] = useState([]);
  const [billing, setBilling] = useState(null);
  const [message, setMessage] = useState('');

  async function refresh() {
    const [planList, billingInfo] = await Promise.all([listPlans(), getBillingMe()]);
    setPlans(planList);
    setBilling(billingInfo);
  }

  useEffect(() => {
    refresh().catch(() => setMessage('Billing data load nahi ho saka.'));
  }, []);

  async function choosePlan(planId) {
    setMessage('');
    try {
      const result = await checkoutMock(planId);
      setMessage(result.message);
      await refresh();
    } catch (error) {
      setMessage(error.response?.data?.error || 'Plan update nahi ho saka.');
    }
  }

  return (
    <section className="card">
      <h2>Pricing & Usage</h2>
      {billing && (
        <p className="status">
          Current plan: {billing.subscription.planId} · Projects this month: {billing.usage.projects}
        </p>
      )}
      {message && <p className="status">{message}</p>}
      <div className="pricingGrid">
        {plans.map(plan => (
          <article className="planCard" key={plan.id}>
            <h3>{plan.name}</h3>
            <strong>${plan.priceMonthlyUsd}/mo</strong>
            <p>{plan.limits.projectsPerMonth} projects/month · {plan.limits.resolution}</p>
            <ul>
              {plan.features.map(feature => <li key={feature}>{feature}</li>)}
            </ul>
            <button type="button" onClick={() => choosePlan(plan.id)}>
              {billing?.subscription.planId === plan.id ? 'Current Plan' : 'Choose Plan'}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
