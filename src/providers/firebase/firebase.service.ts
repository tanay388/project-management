import { Injectable } from '@nestjs/common';

import * as admin from 'firebase-admin';

import DecodedIdToken = admin.auth.DecodedIdToken;
import Auth = admin.auth.Auth;
import { ConfigService } from '@nestjs/config';
import { UserRecord } from 'firebase-admin/lib/auth/user-record';
import axios from 'axios';
export type FirebaseUser = DecodedIdToken;
export type CreateFirebaseUserParams = {
  email: string;
  password: string;
  displayName?: string;
};

@Injectable()
export class FirebaseService {
  auth: Auth;
  app: admin.app.App;
  messaging: admin.messaging.Messaging;
  //   webApiKey: String;

  /**
   * Initializes the FirebaseService.
   * If the Firebase app has not been initialized, it initializes it with the provided
   * configuration. If the app has already been initialized, it just returns the existing
   * app.
   */
  constructor() {
    if (admin.apps.length === 0) {
      this.app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.GOOGLE_PROJECT_ID,
          clientEmail: process.env.GOOGLE_CLIENT_EMAIL,
          privateKey: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });
    } else {
      this.app = admin.app();
    }

    this.auth = admin.auth();
    this.messaging = admin.messaging();
  }

  async getUserProfile(token: string): Promise<FirebaseUser> {
    try {
      if (token.startsWith('id')) {
        // console.log(token)
        const user = await this.auth.getUser(token.replace('id ', ''));
        // token = user;
        const user_decoded_id =
          await this.transformUserRecordToTokenFormat(user);
        // console.log(user_decoded_id);
        return user_decoded_id;
      }
      const value = await this.auth.verifyIdToken(token, true);
      // const v2= await this.auth.verifynm

      return value;
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  async transformUserRecordToTokenFormat(
    userRecord: UserRecord,
  ): Promise<DecodedIdToken> {
    try {
      // Assuming displayName and photoURL are present in the userRecord
      const userProfile: DecodedIdToken = {
        name: userRecord.displayName,
        picture: userRecord.photoURL,
        iss: 'https://securetoken.google.com/' + process.env.GOOGLE_PROJECT_ID,
        aud: process.env.GOOGLE_PROJECT_ID,
        auth_time: Math.floor(Date.now() / 1000),
        user_id: userRecord.uid,
        sub: userRecord.uid,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600, // Set expiration time (1 hour from now)
        email: userRecord.email,
        email_verified: userRecord.emailVerified,
        firebase: {
          identities: {
            'google.com': [[]],
            email: [[]],
          },
          sign_in_provider: 'google.com',
        },
        uid: userRecord.uid,
      };

      return userProfile;
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  async getAccessToken(): Promise<string> {
    const accessToken = await this.app.options.credential.getAccessToken();
    return accessToken.access_token;
  }

  /**
   * Creates a new user in Firebase Authentication
   * @param params User creation parameters including email and password
   * @returns The created user record
   */
  async createUser(params: CreateFirebaseUserParams): Promise<UserRecord> {
    try {
      return await this.auth.createUser({
        email: params.email,
        password: params.password,
        displayName: params.displayName || params.email.split('@')[0],
        emailVerified: false,
      });
    } catch (error) {
      console.error('Error creating Firebase user:', error);
      throw error;
    }
  }

  /**
   * Checks if a user with the given email exists in Firebase
   * @param email The email to check
   * @returns The user record if found, null otherwise
   */
  async getUserByEmail(email: string): Promise<UserRecord | null> {
    try {
      return await this.auth.getUserByEmail(email);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        return null;
      }
      console.error('Error checking Firebase user:', error);
      throw error;
    }
  }

  /**
   * Deletes a user from Firebase Authentication
   * @param uid The user ID to delete
   */
  async deleteUser(uid: string): Promise<void> {
    try {
      await this.auth.deleteUser(uid);
    } catch (error) {
      console.error('Error deleting Firebase user:', error);
      throw error;
    }
  }
}
