import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  setDoc,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../config/fbConfig";

// ==========================================
// ARTÍCULOS
// ==========================================

export const createArticle = async (articleData) => {
  try {
    const docRef = await addDoc(collection(db, "articulos"), {
      ...articleData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return { id: docRef.id, ...articleData };
  } catch (error) {
    console.error("Error creando el artículo:", error);
    throw error;
  }
};

export const getArticles = async (filters = {}) => {
  try {
    let q = collection(db, "articulos");

    if (filters.category && filters.category !== "Todos") {
      q = query(q, where("categoria", "==", filters.category));
    }

    if (filters.salaId && filters.salaId !== "todas") {
      q = query(q, where("salaId", "==", filters.salaId));
    }

    if (filters.available) {
      q = query(q, where("stock", ">", 0));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error al obtener artículos:", error);
    throw error;
  }
};

export const getArticle = async (articleId) => {
  try {
    const docRef = doc(db, "articulos", articleId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    throw new Error("Artículo no encontrado");
  } catch (error) {
    console.error("Error al obtener artículo:", error);
    throw error;
  }
};

export const updateArticle = async (articleId, updates) => {
  try {
    const docRef = doc(db, "articulos", articleId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error al actualizar artículo:", error);
    throw error;
  }
};

export const deleteArticle = async (articleId) => {
  try {
    await deleteDoc(doc(db, "articulos", articleId));
  } catch (error) {
    console.error("Error al eliminar artículo:", error);
    throw error;
  }
};

// ==========================================
// SALAS Y LABORATORIOS
// ==========================================

export const getSalas = async () => {
  try {
    const snapshot = await getDocs(collection(db, "salas"));
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error al obtener salas:", error);
    return [];
  }
};

export const subscribeToSalas = (callback) => {
  const q = collection(db, "salas");
  return onSnapshot(
    q,
    (snapshot) => {
      const salas = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(salas);
    },
    (error) => {
      console.error("Error al suscribirse a salas:", error);
      callback([]);
    }
  );
};

// ==========================================
// PRÉSTAMOS Y SOLICITUDES DINÁMICAS
// ==========================================

export const createLoan = async (loanData) => {
  try {
    // Las solicitudes inician en estado "pendiente" para revisión del Gestor
    const estadoInicial = loanData.estado || "pendiente";

    const payload = {
      ...loanData,
      estado: estadoInicial,
      fueReasignada: false,
      fechaSolicitud: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, "solicitudes"), payload);

    // Registro espejo en prestamos para compatibilidad
    await setDoc(doc(db, "prestamos", docRef.id), {
      id: docRef.id,
      ...payload,
    });

    return { id: docRef.id, ...payload };
  } catch (error) {
    console.error("Error al crear solicitud de préstamo:", error);
    throw error;
  }
};

export const getLoans = async (userId) => {
  try {
    let q = collection(db, "solicitudes");

    if (userId) {
      q = query(q, where("userId", "==", userId));
    }

    const snapshot = await getDocs(q);
    const loans = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Ordenar por fecha descendente
    return loans.sort(
      (a, b) =>
        new Date(b.fechaSolicitud || b.createdAt || 0).getTime() -
        new Date(a.fechaSolicitud || a.createdAt || 0).getTime()
    );
  } catch (error) {
    console.error("Error al obtener préstamos:", error);
    throw error;
  }
};

export const getLoan = async (loanId) => {
  try {
    const docRef = doc(db, "solicitudes", loanId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    throw new Error("Préstamo no encontrado");
  } catch (error) {
    console.error("Error al obtener préstamo:", error);
    throw error;
  }
};

export const updateLoan = async (loanId, updates) => {
  try {
    const docRef = doc(db, "solicitudes", loanId);
    const timestampUpdates = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await updateDoc(docRef, timestampUpdates);
    await updateDoc(doc(db, "prestamos", loanId), timestampUpdates);
  } catch (error) {
    console.error("Error al actualizar préstamo:", error);
    throw error;
  }
};

export const returnLoan = async (loanId) => {
  try {
    const loanRef = doc(db, "solicitudes", loanId);
    const loanSnap = await getDoc(loanRef);

    if (loanSnap.exists()) {
      const loanData = loanSnap.data();

      const returnUpdates = {
        estado: "devuelto",
        fechaDevolucion: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(loanRef, returnUpdates);
      await updateDoc(doc(db, "prestamos", loanId), returnUpdates);

      // Devolver stock al artículo
      if (loanData.articuloId) {
        const articleRef = doc(db, "articulos", loanData.articuloId);
        const articleSnap = await getDoc(articleRef);
        if (articleSnap.exists()) {
          await updateDoc(articleRef, {
            stock: (articleSnap.data().stock || 0) + (loanData.cantidad || 1),
            updatedAt: new Date().toISOString(),
          });
        }
      }
    }
  } catch (error) {
    console.error("Error al devolver préstamo:", error);
    throw error;
  }
};

export const deleteLoan = async (loanId) => {
  try {
    await deleteDoc(doc(db, "solicitudes", loanId));
    await deleteDoc(doc(db, "prestamos", loanId));
  } catch (error) {
    console.error("Error al eliminar préstamo:", error);
    throw error;
  }
};

// ==========================================
// SUSCRIPCIONES EN TIEMPO REAL
// ==========================================

export const subscribeToLoans = (userId, callback) => {
  let q = collection(db, "solicitudes");

  if (userId) {
    q = query(q, where("userId", "==", userId));
  }

  return onSnapshot(
    q,
    (snapshot) => {
      const loans = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Ordenar cronológicamente
      loans.sort(
        (a, b) =>
          new Date(b.fechaSolicitud || b.createdAt || 0).getTime() -
          new Date(a.fechaSolicitud || a.createdAt || 0).getTime()
      );

      callback(loans);
    },
    (error) => {
      console.error("Error al suscribirse a solicitudes/préstamos:", error);
      callback([]);
    }
  );
};

export const subscribeToArticles = (callback) => {
  const q = collection(db, "articulos");

  return onSnapshot(
    q,
    (snapshot) => {
      const articles = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(articles);
    },
    (error) => {
      console.error("Error al suscribirse a artículos:", error);
      callback([]);
    }
  );
};
