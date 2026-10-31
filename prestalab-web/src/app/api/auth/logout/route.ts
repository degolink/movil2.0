import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('prestalab_session');

    return NextResponse.json({
      success: true,
      message: 'Sesión cerrada correctamente.',
    });
  } catch (error: any) {
    console.error('Error in logout route:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
