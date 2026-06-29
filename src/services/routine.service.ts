import {
  DailyExerciseSetsDto,
  DailyStudentExerciseDto,
  ExerciseDto,
  UpdateCompleteDailyStudentExerciseDto,
  UpdateDailyStudentExerciseDto,
} from "@/dtos/exerciseDto";

import api from "./api";

// Exercises
export const postExercise = async (routineData: ExerciseDto) => {
  try {
    const response = await api.post("/Exercises", routineData);
    const { data } = response.data;

    return data;
  } catch (error) {
    console.error("Error al crear el ejercicio", error);
    throw error;
  }
};

export const getExercise = async (id: number) => {
  try {
    const response = await api.get(`/Exercises/${id}`);
    const { data } = response.data;

    return data;
  } catch (error) {
    console.error("Error al obtener el ejercicio", error);
    throw error;
  }
};

export const getExerciseByMuscleGroupId = async (id: number) => {
  try {
    const response = await api.get(`/Exercises/muscle-group/${id}`);
    const { data } = response.data;

    return data;
  } catch (error) {
    console.error("Error al obtener el Ejercicio", error);
    throw error;
  }
};

export const getExerciseByMuscleGroupName = async (name: string) => {
  try {
    const response = await api.get(`/Exercises/by-muscle-name/${name}`);
    const { data } = response.data;

    return data;
  } catch (error) {
    console.error("Error al obtener el Ejercicio", error);
    throw error;
  }
};

export const getExerciseByCoachId = async (id: number) => {
  try {
    const response = await api.get(`/Exercises/coach/${id}`);
    const { data } = response.data;

    return data;
  } catch (error) {
    console.error("Error al obtener el Ejercicio", error);
    throw error;
  }
};

export const updateExercise = async (id: number, routineData: ExerciseDto) => {
  try {
    const response = await api.put(`/Exercises/${id}`, routineData);
    const { data } = response.data;

    return data;
  } catch (error) {
    console.error("Error al actualizar el ejercicio", error);
    throw error;
  }
};

export const deleteExercise = async (id: number) => {
  try {
    const response = await api.delete(`/Exercises/${id}`);
    const { data } = response.data;
    return data;
  } catch (error) {
    console.error("Error al eliminar el ejercicio", error);
    throw error;
  }
};

// dailyExercisesStudents
export const postDailyStudentExercises = async (exerciseData: DailyStudentExerciseDto) => {
  try {
    const response = await api.post("/DailyStudentExercises", exerciseData);
    const { data } = response.data;

    return data;
  } catch (error) {
    console.error("Error al crear el ejercicio para el cliente", error);
    throw error;
  }
};

export const updateCompleteDailyStudentExercises = async (
  id: number,
  exerciseData: UpdateCompleteDailyStudentExerciseDto,
) => {
  try {
    const response = await api.put(`/DailyStudentExercises/complete/${id}`, exerciseData);
    const { data } = response.data;

    return data;
  } catch (error) {
    console.error("Error al actualizar el ejercicio para el cliente", error);
    throw error;
  }
};

export const updateDailyStudentsExercises = async (
  id: number,
  exerciseData: UpdateDailyStudentExerciseDto,
) => {
  try {
    const response = await api.put(`/DailyStudentExercises/${id}`, exerciseData);
    const { data } = response.data;

    return data;
  } catch (error) {
    console.error("Error al actualizar el ejercicio para el cliente", error);
    throw error;
  }
};

export const getDailyStudentExercisesByStudentId = async (id: number) => {
  try {
    const response = await api.get(`/DailyStudentExercises/student/${id}`);
    const { data } = response.data;

    return data;
  } catch (error) {
    console.error("Error al obtener los ejercicios del cliente", error);
    throw error;
  }
};

export const getDailyStudentExercisesByStudentIdAndDate = async (id: number, date: string) => {
  try {
    const response = await api.get(`/DailyStudentExercises/student/${id}/date/${date}`);
    const { data } = response.data;

    return data;
  } catch (error) {
    console.error("Error al obtener los ejercicios del cliente", error);
    throw error;
  }
};

export const getDailyStudentExercisesByStudentIdAndDates = async (
  id: number,
  dateS: string,
  dateE: string,
) => {
  try {
    const response = await api.get(
      `/DailyStudentExercises/student/${id}/date/start/${dateS}/end/${dateE}`,
    );
    const { data } = response.data;

    return data;
  } catch (error) {
    console.error("Error al obtener los ejercicios del cliente", error);
    throw error;
  }
};

export const deleteDailyStudentExercises = async (id: number) => {
  try {
    const response = await api.delete(`/DailyStudentExercises/${id}`);
    const { data } = response.data;
    return data;
  } catch (error) {
    console.error("Error al eliminar el ejercicio", error);
    throw error;
  }
};

// DailyExercisesSets
export const postDailyExercisesSets = async (exerciseSetData: DailyExerciseSetsDto) => {
  try {
    const response = await api.post("/DailyExerciseSets", { set: exerciseSetData });
    const { data } = response.data;

    return data;
  } catch (error) {
    console.error("Error al crear el set", error);
    throw error;
  }
};

export const getDailyExercisesSets = async () => {
  try {
    const response = await api.get(`/DailyExerciseSets`);
    const { data } = response.data;

    return data;
  } catch (error) {
    console.error("Error al obtener los sets", error);
    throw error;
  }
};

export const getDailyExercisesSetsById = async (id: number) => {
  try {
    const response = await api.get(`/DailyExerciseSets/${id}`);
    const { data } = response.data;

    return data;
  } catch (error) {
    console.error("Error al obtener los sets", error);
    throw error;
  }
};

export const updateDailyExercisesSets = async (
  id: number,
  exerciseSetData: DailyExerciseSetsDto,
) => {
  try {
    const response = await api.put(`/DailyExerciseSets/${id}`, exerciseSetData);
    const { data } = response.data;

    return data;
  } catch (error) {
    console.error("Error al obtener los sets", error);
    throw error;
  }
};

export const deleteDailyExercisesSets = async (id: number) => {
  try {
    const response = await api.delete(`/DailyExerciseSets/${id}`);
    const { data } = response.data;
    return data;
  } catch (error) {
    console.error("Error al eliminar el set", error);
    throw error;
  }
};

// muscleGroup
export const getMuscleGroups = async () => {
  try {
    const response = await api.get(`/MuscleGroups`);
    const { data } = response.data;

    return data;
  } catch (error) {
    console.error("Error al obtener los grupos musculares", error);
    throw error;
  }
};
