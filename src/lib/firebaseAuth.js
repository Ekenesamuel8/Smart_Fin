import axios from "axios";
import { initializeApp } from "firebase/app";
import {
	getAuth,
	GoogleAuthProvider,
	signInWithPopup,
	signInWithEmailAndPassword,
} from "firebase/auth";

const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const FIREBASE_AUTH_URL = `https://identitytoolkit.googleapis.com/v1/accounts:`;

// Firebase configuration (replace with your actual config)
const firebaseConfig = {
	apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
	authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
	projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
	storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
	appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const getUserNameForEmail = async (email, password) => {
	try {
		// Sign in the user with email and password
		const userCredential = await signInWithEmailAndPassword(
			auth,
			email,
			password
		);
		const user = userCredential.user;

		console.log("User:", user); // Debugging

		// Clear any existing user data in localStorage before storing new values
		localStorage.removeItem("userName");

		// Store session data in localStorage, including displayName and email
		const userData = {
			displayName: user.displayName || user.email, // Fallback to email if no displayName
			email: user.email,
		};

		// Save the user data in localStorage
		localStorage.setItem("userName", JSON.stringify(userData));

		return user;
	} catch (error) {
		console.error("Error during email/password sign-in:", error);
		throw error;
	}
};

const getUserNameForGoogleEmail = async (result) => {
	const provider = new GoogleAuthProvider();
	try {
		const user = result.user;

		console.log("Google User:", user); // Debugging

		// Clear any existing user data in localStorage before storing new values
		localStorage.removeItem("userName");

		// Store session data in localStorage
		const userData = {
			displayName: user.displayName || "Google User", // Fallback to "Google User" if no displayName
			email: user.email,
		};

		// Save the user data in localStorage
		localStorage.setItem("userName", JSON.stringify(userData));

		return user;
	} catch (error) {
		console.error("Error during Google sign-in:", error);
		throw error;
	}
};

// Sign up with Email and Password
export const signupWithEmailPassword = async (email, password) => {
	try {
		const response = await axios.post(
			`${FIREBASE_AUTH_URL}signUp?key=${API_KEY}`,
			{
				email,
				password,
				returnSecureToken: true,
			}
		);
		const { idToken, refreshToken, localId } = response.data;
		storeSession(idToken, refreshToken, localId);
		getUserNameForEmail(email, password);
		return response.data;
	} catch (error) {
		console.error("Signup error", error);
		throw error;
	}
};
// Email and Password Sign-In
export const signinWithEmailPassword = async (email, password) => {
	try {
		const userCredential = await signInWithEmailAndPassword(
			auth,
			email,
			password
		);
		const user = userCredential.user;
		getUserNameForEmail(email, password);
		return user;
	} catch (error) {
		throw error;
	}
};
// Google Sign-In
export const signupWithGoogle = async () => {
	const provider = new GoogleAuthProvider();
	try {
		const result = await signInWithPopup(auth, provider);
		const credential = GoogleAuthProvider.credentialFromResult(result);
		const token = credential.accessToken;
		const user = result.user;
		getUserNameForGoogleEmail(result)
		return { user, token };
	} catch (error) {
		throw error;
	}
};
// Logout
export const logout = () => {
	localStorage.removeItem("idToken");
	localStorage.removeItem("refreshToken");
	localStorage.removeItem("localId");
};

// Store session in localStorage
const storeSession = (idToken, refreshToken, localId) => {
	localStorage.setItem("idToken", idToken);
	localStorage.setItem("refreshToken", refreshToken);
	localStorage.setItem("localId", localId);
};

// Get session from localStorage
export const getSession = () => {
	return {
		idToken: localStorage.getItem("idToken"),
		refreshToken: localStorage.getItem("refreshToken"),
		localId: localStorage.getItem("localId"),
	};
};

// Set session with expiry (e.g., 7 days)
export const setSessionWithExpiry = (key, value, ttl) => {
	const now = new Date();
	const expiry = now.getTime() + ttl; // Time to live in milliseconds
	const sessionData = { value, expiry };
	localStorage.setItem(key, JSON.stringify(sessionData));
};

// Get session and check if expired
export const getSessionWithExpiry = (key) => {
	const sessionData = localStorage.getItem(key);
	if (!sessionData) {
		return null;
	}
	const parsedData = JSON.parse(sessionData);
	const now = new Date();

	if (now.getTime() > parsedData.expiry) {
		// Session expired
		localStorage.removeItem(key);
		return null;
	}
	return parsedData.value;
};
