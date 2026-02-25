import logging
from oauth.models import MetaToken, MetaUser
from meta.models import MetaPage, MetaLeadForm
from meta.services.meta_api import MetaAPIClient

logger = logging.getLogger('smartanalytics.sync')


def sync_lead_forms(user, page_ids):
    """Sync leadgen forms for selected pages."""
    token = MetaToken.objects.get(user=user)
    client = MetaAPIClient(token.token)
    meta_user = MetaUser.objects.get(user=user)
    results = {}

    for page in MetaPage.objects.filter(user=user, page_id__in=page_ids):
        try:
            forms = client.get_leadgen_forms(page.page_id, page.page_access_token)
            for f in forms:
                MetaLeadForm.objects.update_or_create(
                    user=user, form_id=f['id'],
                    defaults={
                        'meta_user_id': meta_user.meta_user_id,
                        'page': page,
                        'name': f.get('name', ''),
                        'status': f.get('status', ''),
                    },
                )
            results[page.page_id] = {'forms': len(forms)}
            logger.info(f'Page {page.page_id}: {len(forms)} lead forms synced')
        except Exception as e:
            logger.error(f'Page {page.page_id}: FAILED - {e}')
            results[page.page_id] = {'error': str(e)}

    return results
