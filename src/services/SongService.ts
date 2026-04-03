import type { Song } from '../types';

export class SongService {
  private readonly STORAGE_KEY = 'drum_machine_songs';

  public async saveSong(song: Song): Promise<void> {
    const songs = await this.getSongs();
    const existingIndex = songs.findIndex(s => s.id === song.id);
    if (existingIndex >= 0) {
      songs[existingIndex] = song;
    } else {
      songs.push(song);
    }
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(songs));
  }

  public async loadSong(id: string): Promise<Song | null> {
    const songs = await this.getSongs();
    return songs.find(s => s.id === id) || null;
  }

  public async listSongs(): Promise<Song[]> {
    return this.getSongs();
  }

  private async getSongs(): Promise<Song[]> {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }
}