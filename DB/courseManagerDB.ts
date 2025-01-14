import { getKv } from "../botStatic/kvClient.ts";
import { Course } from "./mainDB.ts";

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
