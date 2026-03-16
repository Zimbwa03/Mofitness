import type { WaterLog } from '../models';
import supabaseService from './SupabaseService';

class WaterService {
  private client = supabaseService.getClient();

  async addWaterLog(userId: string, logDate: string, amountMl: number) {
    const { data, error } = await this.client
      .from('water_logs')
      .insert({
        user_id: userId,
        log_date: logDate,
        amount_ml: amountMl,
      })
      .select('*')
      .single<WaterLog>();

    if (error) {
      throw error;
    }

    return data;
  }
}

const waterService = new WaterService();

export default waterService;
