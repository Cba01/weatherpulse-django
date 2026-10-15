// Shapes of the JSON returned by the Django API (see the DRF serializers).

export type User = {
  id: number;
  username: string;
  email: string;
};

export type Tokens = {
  access: string;
  refresh: string;
};

export type City = {
  id: number;
  name: string;
  country: string;
  lat: number;
  lon: number;
};
