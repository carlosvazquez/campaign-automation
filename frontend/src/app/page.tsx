'use client';

/** @file Redirect to new campaign page — prevents 040 */

import { redirect } from 'next/navigation';
export default function Home() { redirect('/campaigns/new'); }
