import React from 'react';
import { Redirect } from 'expo-router';

export default function StylistDashboardRedirect() {
  return <Redirect href="/(stylist-tabs)/dashboard" />;
}