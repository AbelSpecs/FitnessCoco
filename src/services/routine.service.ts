import {
  DailyExerciseSetsDto,
  DailyStudentExerciseDto,
  ExerciseDto,
  UpdateDailyStudentExerciseDto,
} from "@/dtos/exerciseDto";
import axios from "axios";
// import api from "./api";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Exercises
export const postExercise = async (routineData: ExerciseDto) => {
  try {
    const response = await api.post("/Exercises", routineData);
    const { data } = response.data;

    return data;
  } catch (error) {
    console.error("Error al crear el ejercicio", error);
    return null;
  }
};

export const getExercise = async (id: number) => {
  try {
    const response = await api.get(`/Exercises/${id}`);
    const { data } = response.data;

    return data;
  } catch (error) {
    console.error("Error al obtener el ejercicio", error);
    return null;
  }
};

export const getExerciseByMuscleGroupId = async (id: number) => {
  try {
    const response = await api.get(`/Exercises/muscle-group/${id}`);
    const { data } = response.data;

    return data;
  } catch (error) {
    console.error("Error al obtener el Ejercicio", error);
    return null;
  }
};

export const getExerciseByMuscleGroupName = async (name: string) => {
  try {
    const response = await api.get(`/Exercises/by-muscle-name/${name}`);
    const { data } = response.data;

    return data;
  } catch (error) {
    console.error("Error al obtener el Ejercicio", error);
    return null;
  }
};

export const getExerciseByCoachId = async (id: number) => {
  try {
    const response = await api.get(`/Exercises/coach/${id}`);
    const { data } = response.data;

    return data;
  } catch (error) {
    console.error("Error al obtener el Ejercicio", error);
    return null;
  }
};

export const updateExercise = async (id: number, routineData: ExerciseDto) => {
  try {
    const response = await api.put(`/Exercises/${id}`, routineData);
    const { data } = response.data;

    return data;
  } catch (error) {
    console.error("Error al actualizar el ejercicio", error);
    return null;
  }
};

export const deleteExercise = async (id: number) => {
  try {
    const response = await api.delete(`/Exercises/${id}`);
    const { data } = response.data;
    return data;
  } catch (error) {
    console.error("Error al eliminar el ejercicio", error);
    return null;
  }
};

// dailyExercisesStudents
export const postDailyStudentExercises = async (exerciseData: DailyStudentExerciseDto) => {
  try {
    const response = await api.post("/DailyStudentExercises", exerciseData);
    const { data } = response.data;
    console.log(data);
    return data;
  } catch (error) {
    console.error("Error al crear el ejercicio para el cliente", error);
    return null;
  }
};

export const updateDailyStudentExercises = async (
  id: number,
  exerciseData: UpdateDailyStudentExerciseDto,
) => {
  try {
    const response = await api.put(`/DailyStudentExercises/complete/${id}`, exerciseData);
    const { data } = response.data;

    return data;
  } catch (error) {
    console.error("Error al actualizar el ejercicio para el cliente", error);
    return null;
  }
};

export const getDailyStudentExercisesByStudentId = async (id: number) => {
  try {
    const response = await api.get(`/DailyStudentExercises/student/${id}`);
    const { data } = response.data;

    return data;
  } catch (error) {
    console.error("Error al obtener los ejercicios del cliente", error);
    return null;
  }
};

export const getDailyStudentExercisesByStudentIdAndDate = async (id: number, date: string) => {
  console.log(id, date);
  try {
    const response = await api.get(`/DailyStudentExercises/student/${id}/date/${date}`);
    const { data } = response.data;

    return data;
  } catch (error) {
    console.error("Error al obtener los ejercicios del cliente", error);
    return null;
  }
};

// DailyExercisesSets
export const postDailyExercisesSets = async (exerciseSetData: DailyExerciseSetsDto) => {
  try {
    const response = await api.post("/DailyExerciseSets", exerciseSetData);
    const { data } = response.data;

    return data;
  } catch (error) {
    console.error("Error al crear el set", error);
    return null;
  }
};

export const getDailyExercisesSets = async () => {
  try {
    const response = await api.get(`/DailyExerciseSets`);
    const { data } = response.data;

    return data;
  } catch (error) {
    console.error("Error al obtener los sets", error);
    return null;
  }
};

export const getDailyExercisesSetsById = async (id: number) => {
  try {
    const response = await api.get(`/DailyExerciseSets/${id}`);
    const { data } = response.data;

    return data;
  } catch (error) {
    console.error("Error al obtener los sets", error);
    return null;
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
    return null;
  }
};

export const deleteDailyExercisesSets = async (id: number) => {
  try {
    const response = await api.delete(`/DailyExerciseSets/${id}`);
    const { data } = response.data;
    return data;
  } catch (error) {
    console.error("Error al eliminar el set", error);
    return null;
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
    return null;
  }
};
