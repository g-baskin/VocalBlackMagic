import { REPLICATE_API_TOKEN } from '$app/env/private';
import { service } from './context';

export const svc = () => service(() => REPLICATE_API_TOKEN?.trim() || null);
