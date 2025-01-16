import { getKv } from "../botStatic/kvClient.ts";
import { Course, getUser, UserData, removeActiveStudent } from "./mainDB.ts";


export async function addCourse(courseName: string, courseLink: string) {
  const kv = await getKv();
  const currentCourses = await getCourses();

  const newCourse: Course = {
    name: courseName,
    link: courseLink,
  };

  currentCourses.push(newCourse);
  await kv.set(["ViBot", "courses"], currentCourses);
}

export async function removeCourse(courseName: string) {
  const kv = await getKv();
  const currentCourses = await getCourses();

  const updatedCourses = currentCourses.filter((course) =>
    course.name !== courseName
  );
  await kv.set(["ViBot", "courses"], updatedCourses);
}

export async function getCourses(): Promise<Course[]> {
  const kv = await getKv();
  const result = await kv.get<Course[]>(["ViBot", "courses"]);
  return result.value || [];
}

export async function getCourseNames(): Promise<string[]> {
  const courses = await getCourses();
  return courses.map((course) => course.name);
}

export async function getCourseByName(
  courseName: string,
): Promise<Course | undefined> {
  const courses = await getCourses();
  return courses.find((course) => course.name === courseName);
}

export async function moveCoursesToHistory(userId: number) {
  const kv = await getKv();
  const userData = await getUser(userId);

  if (userData.value) {
    
    const currentCourses = userData.value.courses || [];
    const courseHistory = userData.value.courseHistory || [];

    
    const updatedHistory = [...courseHistory, ...currentCourses];

    // Обновляем данные пользователя
    userData.value.courseHistory = updatedHistory;
    userData.value.courses = []; // Очищаем текущие курсы

    await kv.set(["ViBot", "userId:", userId], userData.value);
  }
}

export async function completeCourse(courseName: string) {
  const kv = await getKv();
  
  const users = kv.list<UserData>({ prefix: ["ViBot", "userId:"] });
  
  for await (const entry of users) {
    if (entry.value) {
      const userId = Number(entry.key[2].toString().replace("userId:", ""));
      
    
      const hasThisCourse = entry.value.courses?.some(
        course => course.name === courseName
      );

      if (hasThisCourse) {
        
        await moveCoursesToHistory(userId);
        
        await removeActiveStudent(userId);
      }
    }
  }
}
