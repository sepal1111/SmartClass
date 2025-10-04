// /src/services/databaseService.js
import { db } from './firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";

// 這個檔案將會是您所有與 Firestore 互動的函式庫。
// 範例：獲取所有學生
export const getStudents = async () => {
  const studentsCol = collection(db, 'students');
  const studentSnapshot = await getDocs(studentsCol);
  const studentList = studentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return studentList;
};

// 範例：新增一個公告
export const createAnnouncement = async (announcement) => {
    try {
        const docRef = await addDoc(collection(db, "announcements"), announcement);
        console.log("Document written with ID: ", docRef.id);
        return docRef.id;
    } catch (e) {
        console.error("Error adding document: ", e);
    }
}

// 後續您可以繼續在這裡擴充其他功能，例如：
// - updateStudent(id, data)
// - deleteStudent(id)
// - saveSeatingChart(layout)
// - getSeatingChart()
// - etc.

