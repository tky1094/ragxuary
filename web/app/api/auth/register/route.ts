import { NextResponse } from 'next/server';

interface RegisterRequest {
  email: string;
  name: string;
  password: string;
}

interface RegisterResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

interface ErrorResponse {
  detail: string;
}

export async function POST(request: Request) {
  try {
    const body: RegisterRequest = await request.json();

    const response = await fetch(
      `${process.env.BACKEND_URL}/api/v1/auth/register`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: body.email,
          name: body.name,
          password: body.password,
        }),
      }
    );

    if (!response.ok) {
      const errorData: ErrorResponse = await response.json();

      if (response.status === 400) {
        return NextResponse.json(
          { error: 'emailAlreadyRegistered' },
          { status: 400 }
        );
      }

      if (response.status === 422) {
        return NextResponse.json({ error: 'validationError' }, { status: 422 });
      }

      return NextResponse.json(
        { error: errorData.detail || 'registrationFailed' },
        { status: response.status }
      );
    }

    const data: RegisterResponse = await response.json();

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'registrationFailed' }, { status: 500 });
  }
}
