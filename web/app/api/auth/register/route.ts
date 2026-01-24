import { NextResponse } from 'next/server';

import { Auth, type TokenResponse } from '@/client';
import { getServerClient } from '@/shared/lib/api/client';

interface RegisterRequestBody {
  email: string;
  name: string;
  password: string;
}

export async function POST(request: Request) {
  try {
    const body: RegisterRequestBody = await request.json();

    const { data, error, response } = await Auth.register({
      client: getServerClient(),
      body: {
        email: body.email,
        name: body.name,
        password: body.password,
      },
    });

    if (error) {
      const status = response?.status ?? 500;

      if (status === 400) {
        return NextResponse.json(
          { error: 'emailAlreadyRegistered' },
          { status: 400 }
        );
      }

      if (status === 422) {
        return NextResponse.json({ error: 'validationError' }, { status: 422 });
      }

      return NextResponse.json({ error: 'registrationFailed' }, { status });
    }

    if (!data) {
      return NextResponse.json(
        { error: 'registrationFailed' },
        { status: 500 }
      );
    }

    const tokens = data as TokenResponse;

    return NextResponse.json(tokens, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'registrationFailed' }, { status: 500 });
  }
}
