import { 
  doc, 
  collection, 
  getDoc, 
  setDoc,
  getDocs,
  writeBatch,
  query,
  limit,
  orderBy,
  deleteDoc
} from 'firebase/firestore';
import { db, OperationType, handleFirestoreError, testConnection } from './firebase';
export { testConnection, OperationType, handleFirestoreError };
import { GroupConfig, Member, SavingTransaction, Loan, SMSMessage, Announcement, DocumentFile } from '../types';
import { 
  INITIAL_GROUP_CONFIG, 
  INITIAL_MEMBERS, 
  INITIAL_TRANSACTIONS, 
  INITIAL_LOANS, 
  INITIAL_SMS 
} from '../sampleData';

const GROUP_ID = 'upendo_unity';

// Document Reference helpers
export const groupDocRef = doc(db, 'groups', GROUP_ID);
export const membersColRef = collection(db, 'groups', GROUP_ID, 'members');
export const transactionsColRef = collection(db, 'groups', GROUP_ID, 'transactions');
export const loansColRef = collection(db, 'groups', GROUP_ID, 'loans');
export const smsColRef = collection(db, 'groups', GROUP_ID, 'smsMessages');

// Dynamic Reference helpers
export function getGroupDocRef(groupId: string) {
  return doc(db, 'groups', groupId);
}
export function getMembersColRef(groupId: string) {
  return collection(db, 'groups', groupId, 'members');
}
export function getTransactionsColRef(groupId: string) {
  return collection(db, 'groups', groupId, 'transactions');
}
export function getLoansColRef(groupId: string) {
  return collection(db, 'groups', groupId, 'loans');
}
export function getSmsColRef(groupId: string) {
  return collection(db, 'groups', groupId, 'smsMessages');
}
export function getAnnouncementsColRef(groupId: string) {
  return collection(db, 'groups', groupId, 'announcements');
}
export function getDocumentsColRef(groupId: string) {
  return collection(db, 'groups', groupId, 'documents');
}

/**
 * Seeds Firestore with initial sample data if the group configuration does not exist yet.
 */
export async function seedInitialDataIfNeeded(groupId: string = GROUP_ID, config?: GroupConfig, initialMembers?: Member[]) {
  try {
    const docRef = getGroupDocRef(groupId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      console.log(`No existing Group Config of "${groupId}" on Firestore. Seeding defaults...`);
      const batch = writeBatch(db);

      // Seed Group config document (merging simulation elements)
      batch.set(docRef, {
        ...(config || INITIAL_GROUP_CONFIG),
        currentSimDate: "2026-06-09",
        activeMemberId: (initialMembers && initialMembers.length > 0) ? initialMembers[0].id : "mem_1"
      });

      // Seed members
      const membersToSeed = initialMembers || INITIAL_MEMBERS;
      const memColRef = getMembersColRef(groupId);
      for (const member of membersToSeed) {
        const memberRef = doc(memColRef, member.id);
        batch.set(memberRef, member);
      }

      // Seed transactions (only for standard default seeding)
      if (!initialMembers) {
        const txColRef = getTransactionsColRef(groupId);
        for (const tx of INITIAL_TRANSACTIONS) {
          const txRef = doc(txColRef, tx.id);
          batch.set(txRef, {
            ...tx,
            syncStatus: 'firebase_synced'
          });
        }
      }

      // Seed loans (only for standard default seeding)
      if (!initialMembers) {
        const lnColRef = getLoansColRef(groupId);
        for (const loan of INITIAL_LOANS) {
          const loanRef = doc(lnColRef, loan.id);
          batch.set(loanRef, loan);
        }
      }

      // Seed smsMessages (only for standard default seeding)
      if (!initialMembers) {
        const smColRef = getSmsColRef(groupId);
        for (const sms of INITIAL_SMS) {
          const smsRef = doc(smColRef, sms.id);
          batch.set(smsRef, sms);
        }
      }

      await batch.commit();
      console.log(`Firestore successfully seeded with ${groupId} initial dataset.`);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `groups/${groupId}`);
  }
}

/**
 * Saves or updates Group Config document
 */
export async function saveGroupAttributes(groupId: string, attributes: Partial<GroupConfig & { currentSimDate: string; activeMemberId: string }>) {
  try {
    await setDoc(getGroupDocRef(groupId), attributes, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `groups/${groupId}`);
  }
}

/**
 * Adds or updates a member
 */
export async function saveMember(groupId: string, member: Member) {
  try {
    const memberRef = doc(getMembersColRef(groupId), member.id);
    await setDoc(memberRef, member);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `groups/${groupId}/members/${member.id}`);
  }
}

/**
 * Adds or updates a transaction
 */
export async function saveTransaction(groupId: string, transaction: SavingTransaction) {
  try {
    const txRef = doc(getTransactionsColRef(groupId), transaction.id);
    await setDoc(txRef, transaction);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `groups/${groupId}/transactions/${transaction.id}`);
  }
}

/**
 * Adds or updates a loan
 */
export async function saveLoan(groupId: string, loan: Loan) {
  try {
    const loanRef = doc(getLoansColRef(groupId), loan.id);
    await setDoc(loanRef, loan);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `groups/${groupId}/loans/${loan.id}`);
  }
}

/**
 * Adds or updates an SMS message
 */
export async function saveSMSMessage(groupId: string, sms: SMSMessage) {
  try {
    const smsRef = doc(getSmsColRef(groupId), sms.id);
    await setDoc(smsRef, sms);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `groups/${groupId}/smsMessages/${sms.id}`);
  }
}

/**
 * Adds or updates an announcement
 */
export async function saveAnnouncement(groupId: string, announcement: Announcement) {
  try {
    const annRef = doc(getAnnouncementsColRef(groupId), announcement.id);
    await setDoc(annRef, announcement);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `groups/${groupId}/announcements/${announcement.id}`);
  }
}

/**
 * Adds or updates a document file
 */
export async function saveDocumentFile(groupId: string, docFile: DocumentFile) {
  try {
    const docRef = doc(getDocumentsColRef(groupId), docFile.id);
    await setDoc(docRef, docFile);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `groups/${groupId}/documents/${docFile.id}`);
  }
}

/**
 * Fetches group configuration
 */
export async function fetchGroupConfig(groupId: string): Promise<GroupConfig | null> {
  try {
    const docSnap = await getDoc(getGroupDocRef(groupId));
    if (docSnap.exists()) {
      return docSnap.data() as GroupConfig;
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Resets Firestore database to default seed state
 */
export async function resetFirestoreDatabase(groupId: string = GROUP_ID) {
  try {
    const batch = writeBatch(db);

    const memColRef = getMembersColRef(groupId);
    const txColRef = getTransactionsColRef(groupId);
    const lnColRef = getLoansColRef(groupId);
    const smColRef = getSmsColRef(groupId);

    // 1. Delete all members
    const membersSnap = await getDocs(memColRef);
    for (const d of membersSnap.docs) {
      batch.delete(d.ref);
    }

    // 2. Delete all transactions
    const txSnap = await getDocs(txColRef);
    for (const d of txSnap.docs) {
      batch.delete(d.ref);
    }

    // 3. Delete all loans
    const loanSnap = await getDocs(lnColRef);
    for (const d of loanSnap.docs) {
      batch.delete(d.ref);
    }

    // 4. Delete all SMS messages
    const smsSnap = await getDocs(smColRef);
    for (const d of smsSnap.docs) {
      batch.delete(d.ref);
    }

    // 5. Reset group doc
    batch.set(getGroupDocRef(groupId), {
      ...INITIAL_GROUP_CONFIG,
      currentSimDate: "2026-06-09",
      activeMemberId: "mem_1"
    });

    // 6. Re-seed members
    for (const member of INITIAL_MEMBERS) {
      const memberRef = doc(memColRef, member.id);
      batch.set(memberRef, member);
    }

    // 7. Re-seed transactions
    for (const tx of INITIAL_TRANSACTIONS) {
      const txRef = doc(txColRef, tx.id);
      batch.set(txRef, {
        ...tx,
        syncStatus: 'firebase_synced'
      });
    }

    // 8. Re-seed loans
    for (const loan of INITIAL_LOANS) {
      const loanRef = doc(lnColRef, loan.id);
      batch.set(loanRef, loan);
    }

    // 9. Re-seed SMS messages
    for (const sms of INITIAL_SMS) {
      const smsRef = doc(smColRef, sms.id);
      batch.set(smsRef, sms);
    }

    await batch.commit();
    console.log(`Firestore "${groupId}" successfully reset to original seed data.`);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `groups/${groupId}`);
  }
}
