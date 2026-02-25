import logging
from datetime import datetime, timedelta
from oauth.models import MetaToken, MetaUser
from meta.models import MetaLeadForm, MetaLead
from meta.services.meta_api import MetaAPIClient

logger = logging.getLogger('smartanalytics.sync')


def sync_leads(user, form_ids, since_timestamp=None):
    """Sync leads for selected forms. Default: last 7 days."""
    if since_timestamp is None:
        since_timestamp = int((datetime.now() - timedelta(days=7)).timestamp())

    token = MetaToken.objects.get(user=user)
    client = MetaAPIClient(token.token)
    meta_user = MetaUser.objects.get(user=user)
    results = {}

    for form in MetaLeadForm.objects.filter(user=user, form_id__in=form_ids).select_related('page'):
        try:
            leads_data = client.get_leads(form.form_id, form.page.page_access_token, since_timestamp)
            count = 0
            for lead in leads_data:
                created_time = datetime.fromisoformat(lead['created_time'].replace('+0000', '+00:00'))
                MetaLead.objects.update_or_create(
                    user=user, lead_id=lead['id'],
                    defaults={
                        'meta_user_id': meta_user.meta_user_id,
                        'form': form,
                        'created_time': created_time,
                        'field_data': lead.get('field_data', []),
                        'ad_id': lead.get('ad_id', ''),
                        'ad_name': lead.get('ad_name', ''),
                        'adset_id': lead.get('adset_id', ''),
                        'adset_name': lead.get('adset_name', ''),
                        'campaign_id': lead.get('campaign_id', ''),
                        'campaign_name': lead.get('campaign_name', ''),
                        'form_id_str': lead.get('form_id', ''),
                        'is_organic': lead.get('is_organic', False),
                        'platform': lead.get('platform', ''),
                    },
                )
                count += 1
            results[form.form_id] = {'leads': count}
            logger.info(f'Form {form.form_id}: {count} leads synced')
        except Exception as e:
            logger.error(f'Form {form.form_id}: FAILED - {e}')
            results[form.form_id] = {'error': str(e)}

    return results
