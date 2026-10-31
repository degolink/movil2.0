import { auth, db } from '../config/fbConfig';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

const errorMessages = {
  'auth/user-not-found': 'No existe una cuenta con este correo.',
  'auth/wrong-password': 'Contraseña incorrecta.',
  'auth/invalid-email': 'El correo electrónico no es válido.',
  'auth/email-already-in-use': 'Ya existe una cuenta con este correo.',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
  'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde.',
  'auth/network-request-failed': 'Error de conexión. Verifica tu internet.',
  'auth/invalid-credential': 'Credenciales inválidas. Verifica tus datos.',
};

const getErrorMessage = (errorCode) => {
  return errorMessages[errorCode] || 'Ocurrió un error. Intenta de nuevo.';
};

export const registerUser = async (email, password, name, lastName, phone, gender = 'Otro') => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const displayName = `${name} ${lastName}`;
    await updateProfile(userCredential.user, {
      displayName,
    });

    // Guardar documento del usuario en Firestore con rol y género
    try {
      await setDoc(doc(db, 'usuarios', userCredential.user.uid), {
        id: userCredential.user.uid,
        nombre: displayName,
        email,
        telefono: phone,
        genero: gender,
        rol: 'estudiante',
        departamento: 'Estudiante',
        createdAt: new Date().toISOString(),
      }, { merge: true });
    } catch (fsErr) {
      console.warn('Advertencia guardando perfil en Firestore:', fsErr);
    }

    return { success: true, user: userCredential.user };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error.code)
    };
  }
};

export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error.code)
    };
  }
};

export const sendPasswordReset = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error.code)
    };
  }
};

export const logoutUser = async () => {
  try {
    await firebaseSignOut(auth);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error.code)
    };
  }
};
